import Grid from '../Grid/Grid';
import styles from './App.module.css'
import * as gameState from '../../gameState';

function App() {
  return (
    <>
      <h1 className={styles.title}>Falling Sand</h1>
      <p className={styles.subtitle}>Click on the canvas to create sand</p>
      <Grid />
      <div className={styles.buttonBar}>
        <button onClick={gameState.reset}>Reset</button>
      </div>
    </>
  )
}

export default App
