import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as gameState from './gameState';

window.addEventListener("blur", () => {
  console.log("window blur");
  gameState.setIsPaused(true);
  
});

window.addEventListener("focus", () => {
  console.log("window focus");
  gameState.setIsPaused(false)
});

ReactDOM.createRoot(document.getElementById('app-root')!).render(
  <App />
)
