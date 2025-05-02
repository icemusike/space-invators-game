import './style.css';
import { Game } from './src/game.js';

// Initialize the game when the window loads
window.addEventListener('load', () => {
  const game = new Game();
  game.start();
});
