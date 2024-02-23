import React from 'react';
import styles from './Grid.module.css';
import * as gameState from '../../gameState';
import * as constants from '../../constants';
import * as events from '../../events';

const range = (n: number) => {
  return new Array(n).fill(undefined).map((_, i) => i);
}

let RENDER_N = 30;
let lastRender = Date.now();
let renderTimes = new Array(RENDER_N).fill(0);
let renderIndex = 0;

const calcAverageRenderTime = () =>
  renderTimes.reduce((total, current) => total + current, 0) / RENDER_N;

const calcAverageFPS = () =>
  Math.floor(1000 / calcAverageRenderTime())


const Grid = ({ }) => {
  const {
    isMouseDown,
    mouseLoc,
    particleGrid,
    isPaused,
  } = React.useSyncExternalStore<gameState.TState>(gameState.subscribe, gameState.getSnapshot);

  // after every render
  React.useEffect(() => {
    if (!isPaused) { 
      events.triggerRenderFinished();

      const currentTime = Date.now();
      renderTimes[renderIndex++] = currentTime - lastRender;
      if (renderIndex >= RENDER_N) {
        renderIndex = 0;
      }
      lastRender = currentTime;
    }
  });

  React.useEffect(() => {
    // starting paused and then unpausing after mount helps prevent the game and 
    // render loop from being triggered multiple times
    gameState.setIsPaused(false)
  }, []);

  const handleMouseMove = (evt: React.MouseEvent<HTMLDivElement>) => {
    gameState.setMouseLoc(getMouseLocationInGrid(evt));
  }

  const handleMouseDown = (evt: React.MouseEvent<HTMLDivElement>) => {
    evt.preventDefault();
    gameState.setMouseDown(true);
  }

  const handleMouseLeave = () => {
    gameState.setMouseLoc({ x: constants.OUT_OF_BOUNDS, y: constants.OUT_OF_BOUNDS });
    gameState.setMouseDown(false);
  }

  const handleMouseUp = () => {
    gameState.setMouseDown(false);
  }

  const getMouseLocationInGrid = (evt: React.MouseEvent<HTMLDivElement>) => {
    return {
      x: Math.floor((evt.clientX - evt.currentTarget.offsetLeft) / constants.PARTICLE_SIZE),
      y: Math.floor((evt.clientY - evt.currentTarget.offsetTop) / constants.PARTICLE_SIZE),
    }
  }

  return (
    <>
      <table 
        className={styles.grid} 
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
      {range(constants.SCREEN_ROWS).map(y =>
        <tr key={y} className={styles.row}>
          {range(constants.SCREEN_COLS).map(x => 
            <DivPixel 
              key={`${y} ${x}`}
              colour={particleGrid[x][y]}
            />
          )}
        </tr>
      )}
      </table>

      <ul>
        {/* 
        <li>mouseDown: {mouseDown.toString()}</li>
        <li>mouseLoc: &#123; x: {mouseLoc.x}, y: {mouseLoc.y} &#125;</li>
        */}
        <li>fps: {isPaused ? 0 : calcAverageFPS() }</li>
        <li>frame time: {isPaused ? 0 : Math.floor(calcAverageRenderTime()) + 'ms' }</li>
      </ul>
    </>

  )
}

const DivPixel = React.memo(({ colour }: { colour?: string }) =>
  <td 
    style={{ 
      width: constants.PARTICLE_SIZE, 
      height: constants.PARTICLE_SIZE,
      backgroundColor: colour || 'white',
    }}
  />
)

export default Grid;