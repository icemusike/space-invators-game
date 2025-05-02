import './style.css';
import { Game } from './src/game.js';

// Initialize the game when the window loads
window.addEventListener('load', () => {
  const game = new Game();
  game.start();
  
  // Add keyboard shortcut info
  console.log('Game Controls:');
  console.log('- Arrow Keys or A/D: Move left/right');
  console.log('- Space: Shoot');
  console.log('- P: Pause game');
  console.log('- L: Toggle leaderboard');
});
