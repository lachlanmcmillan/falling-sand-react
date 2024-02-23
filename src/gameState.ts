import * as events from './events';
import * as constants from './constants';

/**-- Types --**/

export type TParticleGrid = Array<Array<string | undefined>>; // color[][]
export type TCoordinates = { x: number, y: number }; 
export type TState = {
  particleGrid: TParticleGrid,
  isMouseDown: boolean,
  mouseLoc: TCoordinates,
  isPaused: boolean,
  avgRenderTime: number;
  avgFPS: number;
};
export type TCallbackFn = () => unknown;

/**-- Internal module state --**/

let _particleGrid: TParticleGrid = initParticleGrid(constants.SCREEN_COLS, constants.SCREEN_ROWS);
let _isMouseDown = false;
let _mouseLocation = { x: constants.OUT_OF_BOUNDS, y: constants.OUT_OF_BOUNDS };
let _colour = Math.floor(Math.random() * 360); // colour of the next particle
let _isPaused = true;

let _subscriberCallbackFn: TCallbackFn | undefined = undefined;

let _lastRenderTimestamp = Date.now();
let _renderTimes = new Array(constants.FRAME_TIMING_SIZE).fill(0);
let _renderTimesPtr = 0;

let _stateSnapshot: TState = {
  particleGrid: _particleGrid,
  isMouseDown: _isMouseDown,
  mouseLoc: _mouseLocation,
  isPaused: _isPaused,
  avgRenderTime: 0,
  avgFPS: 0
}

/**-- Internal functionality --**/

events.onRenderFinished(() => {
  gameLoop();
})

function gameLoop() {
  if (_isPaused) return;

  updateRenderTimes();
  const avgRenderTime = calcAverageRenderTime();
  const avgFPS = 1000 / avgRenderTime;

  updateSandParticles();
  handleMouseInput();

  _stateSnapshot = {
    particleGrid: _particleGrid,
    isPaused: _isPaused,
    isMouseDown: _isMouseDown, // exported for debugging purposes
    mouseLoc: _mouseLocation, // exported for debugging purposes
    avgRenderTime,
    avgFPS
  }

  // trigger a react render by calling the callback function that react 
  // provides
  _subscriberCallbackFn!();
}

// @mutates internal state
function updateSandParticles() {
  // go from the bottom upwards, skipping the bottom-most row, as those 
  // particles have nowhere to go
  for (let y = constants.SCREEN_ROWS - 2; y >= 0; y--) {
    for (let x = 0; x < constants.SCREEN_COLS; x++) {
      // an empty space should be `undefined`
      if (_particleGrid[x][y]) {
        // sand should fall downwards until it reaches the bottom 
        if (!_particleGrid[x][y+1]) {
          _particleGrid[x][y+1] = _particleGrid[x][y];
          _particleGrid[x][y] = undefined;
        } else {
          // below space is taken, spill sideways
          const canGoLeft = x > 0 && !_particleGrid[x-1][y+1];
          const canGoRight = x < constants.SCREEN_COLS-1 && !_particleGrid[x+1][y+1];
          if (canGoLeft && canGoRight) {
            if (Math.random() < 0.5) {
              _particleGrid[x-1][y+1] = _particleGrid[x][y];
            } else {
              _particleGrid[x+1][y+1] = _particleGrid[x][y];
            }
            _particleGrid[x][y] = undefined;
          } else if (canGoLeft) {
            _particleGrid[x-1][y+1] = _particleGrid[x][y];
            _particleGrid[x][y] = undefined;
          } else if (canGoRight) {
            _particleGrid[x+1][y+1] = _particleGrid[x][y];
            _particleGrid[x][y] = undefined;
          }
        }
      }
    }
  }
}

// @mutates internal state
function handleMouseInput() {
  if (
    _isMouseDown && 
    _mouseLocation.x >= 0 && _mouseLocation.x < constants.SCREEN_COLS &&
    _mouseLocation.y >= 0 && _mouseLocation.y < constants.SCREEN_ROWS
  ) {
    const { x, y } = _mouseLocation;
    if (_colour >= 360) _colour = 0;
    _particleGrid[x][y] = `hsl(${_colour++}, 42%, 61%)`;
  }
}

// @mutates internal state
const updateRenderTimes = () => {
  const currentTimestamp = Date.now();
  _renderTimes[_renderTimesPtr++] = currentTimestamp - _lastRenderTimestamp;
  if (_renderTimesPtr >= constants.FRAME_TIMING_SIZE) {
    _renderTimesPtr = 0;
  }
  _lastRenderTimestamp = currentTimestamp;
}

// average time to generate and render frame in ms over the last `n` frames.
const calcAverageRenderTime = () => {
  return _renderTimes.reduce((total, current) => total + current, 0) / constants.FRAME_TIMING_SIZE;
}

function initParticleGrid(cols, rows, value=undefined) {
  return (new Array(cols))
    .fill(undefined)
    .map(_ => (new Array(rows))
      .fill(undefined)
      .map(_ => value)
    )
}

/**-- Public functions --**/

export function subscribe(callbackFn: () => unknown) {
	_subscriberCallbackFn = callbackFn;
  
  // unsubscribe 
	return () => {
    _subscriberCallbackFn = undefined;
  };
}

export function getSnapshot(): TState { 
	return _stateSnapshot;
}

export function setMouseLoc(newLoc: TCoordinates) {
  _mouseLocation = newLoc;
}

export function setMouseDown(newValue: boolean) {
  _isMouseDown = newValue;
}

export function setIsPaused(newValue: boolean) {
  _isPaused = newValue;

  // start rendering loop again
  if (!_isPaused) {
    gameLoop();
  }
}
