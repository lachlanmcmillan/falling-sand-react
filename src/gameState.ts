import * as events from './events';
import * as constants from './constants';

/**-- Types --**/

export type TParticleGrid = Array<Array<string | undefined>>; // color[][]
export type TCoordinates = { x: number, y: number }; 
export type TState = {
  particleGrid: TParticleGrid,
  isPaused: boolean,
  avgRenderTime: number,
  avgFPS: number,
  saturation: string,
  lightness: string,
};
export type TCallbackFn = () => unknown;

/**-- Internal module state --**/

let _particleGrid: TParticleGrid = initParticleGrid(constants.SCREEN_COLS, constants.SCREEN_ROWS);
let _isMouseDown = false;
let _mouseLocation = { x: constants.OUT_OF_BOUNDS, y: constants.OUT_OF_BOUNDS };
let _particleColour = {
  hue: Math.floor(Math.random() * 360),
  saturation: '100',
  lightness: '90'
}
let _isPaused = true;

let _subscriberCallbackFn: TCallbackFn | undefined = undefined;

let _lastRenderTimestamp = Date.now();
let _renderTimes = new Array(constants.FRAME_TIMING_SIZE).fill(0);
let _renderTimesPtr = 0;

let _stateSnapshot: TState = {
  particleGrid: _particleGrid,
  isPaused: _isPaused,
  avgRenderTime: 0,
  avgFPS: 0,
  saturation: _particleColour.saturation,
  lightness: _particleColour.lightness,
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

  // physics will run as fast as the game can render
  updateSandParticles();
  handleMouseInput();

  _stateSnapshot = {
    particleGrid: _particleGrid,
    isPaused: _isPaused,
    avgRenderTime,
    avgFPS,
    saturation: _particleColour.saturation,
    lightness: _particleColour.lightness,
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
    if (++_particleColour.hue >= 360) _particleColour.hue = 0;
    _particleGrid[x][y] = `hsl(${_particleColour.hue}, ${_particleColour.saturation}%, ${_particleColour.lightness}%)`;
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

export function reset() {
  _particleGrid = initParticleGrid(constants.SCREEN_COLS, constants.SCREEN_ROWS);
}

export function setColourSaturation(newValue: string) {
  _particleColour.saturation = newValue;
}

export function setColourLightness(newValue: string) {
  _particleColour.lightness = newValue;
}
