import React from 'react';
import styles from './App.module.css';
import * as gameState from './gameState';
import * as constants from './constants';
import * as events from './events';

// 1ms saved by pre-initialising here
const rows = Array(constants.SCREEN_ROWS).fill(undefined);
const cols = Array(constants.SCREEN_COLS).fill(undefined)

function App() {
  const {
    particleGrid,
    isPaused,
    avgFPS,
    avgRenderTime,
    saturation,
    lightness
  } = React.useSyncExternalStore<gameState.TState>(gameState.subscribe, gameState.getSnapshot);

  // after every render
  React.useEffect(() => {
    events.triggerRenderFinished();
  });

  const handleMouseMove = React.useCallback((evt: React.MouseEvent<HTMLDivElement>) => {
    gameState.setMouseLocation(getMouseLocationInGrid(evt));
  }, []);

  const handleMouseDown = React.useCallback((evt: React.MouseEvent<HTMLDivElement>) => {
    evt.preventDefault();
    gameState.setMouseDown(true);
    if (isPaused) gameState.setIsPaused(false);
  }, [isPaused]);

  const handleMouseLeave = React.useCallback(() => {
    gameState.setMouseLocation({ x: constants.OUT_OF_BOUNDS, y: constants.OUT_OF_BOUNDS });
    gameState.setMouseDown(false);
  }, []);

  const handleMouseUp = React.useCallback(() => {
    gameState.setMouseDown(false);
  }, []);

  const getMouseLocationInGrid = React.useCallback((evt: React.MouseEvent<HTMLDivElement>) => {
    return {
      x: Math.floor((evt.clientX - evt.currentTarget.offsetLeft) / constants.PARTICLE_SIZE),
      y: Math.floor((evt.clientY - evt.currentTarget.offsetTop) / constants.PARTICLE_SIZE),
    }
  }, []);

  return (
    <>
      <Header />

      <div className={styles.debugInfo}>
        fps: {isPaused ? 0 : Math.floor(avgFPS)},
        frame time: {isPaused ? 0 : Math.floor(avgRenderTime) + 'ms' }
      </div>

      <table 
        className={styles.table} 
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {rows.map((_, y) =>
          <tr className={styles.row}>
            {cols.map((_, x) => 
              <td 
                style={{ 
                  width: constants.PARTICLE_SIZE, 
                  height: constants.PARTICLE_SIZE,
                  backgroundColor: particleGrid[x][y] || 'white',
                }}
              />
            )}
          </tr>
        )}
      </table>

      <ColourControls saturation={saturation} lightness={lightness} />

      <ButtonBar />
    </>
  )
}

const Header = React.memo(() => 
  <>
    <h1 className={styles.title}>Falling Sand</h1>
    <p className={styles.subtitle}>Click on the canvas to create sand</p>
  </>
);

const ColourControls = React.memo(({ saturation, lightness }: any) => 
  <fieldset>
    <legend>Colour</legend>
    <div>
      <label className={styles.sliderLabel}>Saturation</label>
      <input 
        className={styles.slider}
        type="range" 
        value={saturation} 
        min="0" 
        max="100" 
        onChange={(evt) => 
          gameState.setColourSaturation(evt.target.value)
        }
      />
    </div>
    <div>
      <label className={styles.sliderLabel}>Lightness</label>
      <input 
        className={styles.slider}
        type="range" 
        value={lightness} 
        min="0" 
        max="100" 
        onChange={(evt) => 
          gameState.setColourLightness(evt.target.value)
        }
      />
    </div>
  </fieldset>
);

const ButtonBar = React.memo(() => 
  <div className={styles.buttonBar}>
    <button onClick={() => gameState.reset()}>Reset</button>
  </div>
);

export default App
