import React from 'react';
import styles from './Grid.module.css';
import * as gameState from '../../gameState';
import * as constants from '../../constants';
import * as events from '../../events';

const range = (n: number) => {
  return new Array(n).fill(undefined).map((_, i) => i);
}

const Grid = ({ }) => {
  const {
    mouseDown,
    mouseLoc,
    grid,
    renderTime,
    isPaused,
  } = React.useSyncExternalStore<gameState.TState>(gameState.subscribe, gameState.getSnapshot);

  // after every render
  React.useEffect(() => {
    if (!isPaused) { 
      events.triggerRenderFinished();
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
      <div 
        className={styles.grid} 
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
      {range(constants.GRID_ROWS).map(y =>
        <div key={y} className={styles.row}>
          {range(constants.GRID_COLS).map(x => 
            <div 
              key={`${y} ${x}`}
              className={styles.cell}
              style={{ 
                width: constants.PARTICLE_SIZE, 
                height: constants.PARTICLE_SIZE,
                backgroundColor: grid[x][y] || 'white'
              }}
            ></div> 
          )}
        </div>
      )}
      </div>

      <ul>
        {/* <li>mouseDown: {mouseDown.toString()}</li>
        <li>mouseLoc: &#123; x: {mouseLoc.x}, y: {mouseLoc.y} &#125;</li> */}
        <li>fps: {isPaused ? 0 : Math.floor(1000 / renderTime)}</li>
      </ul>
    </>

  )
}

export default Grid;