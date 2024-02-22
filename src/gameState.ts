import * as events from './events';
import * as constants from './constants';

/**-- Types --**/

export type TGrid = Array<Array<string | undefined>>; // color[][]
export type TCoordinates = { x: number, y: number }; 
export type TState = {
  grid: TGrid,
  mouseDown: boolean,
  mouseLoc: TCoordinates,
  isPaused: boolean,
  renderTime: number,
  timestamp: number,
};
export type TCallbackFn = () => unknown;

/**-- Internal state - Do not expose directly --**/

let _grid: TGrid = initGrid(constants.GRID_COLS, constants.GRID_ROWS);
let _mouseDown = false;
let _mouseLoc = { x: constants.OUT_OF_BOUNDS, y: constants.OUT_OF_BOUNDS };
let _isPaused = true;
let _subscriberCallback: TCallbackFn | undefined = undefined;
let _colour = Math.floor(Math.random() * 360);

let _stateSnapshot: TState = {
  grid: _grid,
  mouseDown: _mouseDown,
  mouseLoc: _mouseLoc,
  isPaused: _isPaused,
  renderTime: 0,
  timestamp: Date.now(),
}

/**-- Internal functionality --**/

events.onRenderFinished(() => {
  gameLoop();
})

function gameLoop() {
  const timestamp = Date.now()

  // -- handle sand physics --
  // go from the bottom upwards, skipping the bottom-most row, as those 
  // particles have nowhere to go
  for (let y = constants.GRID_ROWS - 2; y >= 0; y--) {
    for (let x = 0; x < constants.GRID_COLS; x++) {
      // isSandy
      if (_grid[x][y]) {
        // sand should fall downwards until it reaches the bottom 
        if (!_grid[x][y+1]) {
          _grid[x][y+1] = _grid[x][y];
          _grid[x][y] = undefined;
        } else {
          // below is taken, spill sideways
          const canGoLeft = x > 0 && !_grid[x-1][y+1];
          const canGoRight = x < constants.GRID_COLS-1 && !_grid[x+1][y+1];
          if (canGoLeft && canGoRight) {
            if (Math.random() < 0.5) {
              _grid[x-1][y+1] = _grid[x][y];
            } else {
              _grid[x+1][y+1] = _grid[x][y];
            }
            _grid[x][y] = undefined;
          } else if (canGoLeft) {
            _grid[x-1][y+1] = _grid[x][y];
            _grid[x][y] = undefined;
          } else if (canGoRight) {
            _grid[x+1][y+1] = _grid[x][y];
            _grid[x][y] = undefined;
          }
        }
      }
    }
  }

  // handle mouse 
  if (
    _mouseDown && 
    _mouseLoc.x >= 0 && _mouseLoc.x < constants.GRID_COLS &&
    _mouseLoc.y >= 0 && _mouseLoc.y < constants.GRID_ROWS
  ) {
    const { x, y } = _mouseLoc;
    if (_colour >= 360) _colour = 0;
    _grid[x][y] = `hsl(${_colour++}, 42%, 61%)`;
  }

  const newStateSnapshot = {
    grid: _grid,
    mouseDown: _mouseDown,
    mouseLoc: _mouseLoc,
    isPaused: _isPaused,
    renderTime: timestamp - _stateSnapshot.timestamp, 
    timestamp,
  }

  // trigger render
  triggerRender(newStateSnapshot);
}

function triggerRender(newState: TState) {
  _stateSnapshot = newState;
  // don't need to send the state back to React, as React calls 
  // getSnapshot
  _subscriberCallback!();
}

function initGrid(cols, rows, value=undefined) {
  return (new Array(cols))
    .fill(undefined)
    .map(_ => (new Array(rows))
      .fill(undefined)
      .map(_ => value)
    )
}

/**-- Public functions --**/

export function subscribe(callbackFn: () => unknown) {
	_subscriberCallback = callbackFn;
  
  // unsubscribe 
	return () => {
    _subscriberCallback = undefined;
  };
}

export function getSnapshot(): TState { 
	return _stateSnapshot;
}

export function setMouseLoc(newLoc: TCoordinates) {
  _mouseLoc = newLoc;
}

export function setMouseDown(newValue: boolean) {
  _mouseDown = newValue;
}

export function setIsPaused(newValue: boolean) {
  _isPaused = newValue;

  // start rendering loop again
  if (!_isPaused) {
    gameLoop();
  }
}
