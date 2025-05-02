# Multiplayer Space Invaders

A retro-style Space Invaders game with multiplayer functionality and global leaderboard.

## Features

- Classic Space Invaders gameplay with retro graphics and sound effects
- Single player mode with increasing difficulty
- Multiplayer mode where players can compete in real-time
- Global leaderboard to track high scores
- Authentic retro sound effects using Web Audio API

## How to Play

1. Clone the repository
2. Install dependencies with `pnpm install`
3. Start the game with `pnpm start`
4. Open your browser to `http://localhost:5173`

## Game Controls

- Arrow Keys (or A/D): Move left/right
- Space: Shoot
- P: Pause game
- L: Toggle leaderboard

## Multiplayer Setup

Before playing multiplayer:

1. Make sure to update the MongoDB connection string in the `.env` file
2. The server runs on port 3000 by default
3. Players can create or join games from the multiplayer menu

## Technologies Used

- JavaScript (ES6+)
- HTML5 Canvas for rendering
- Web Audio API for sound effects
- Socket.IO for real-time multiplayer
- Express for the backend server
- MongoDB for leaderboard storage

## Development

- Run `pnpm dev` to start the frontend only
- Run `pnpm server` to start the backend only
- Run `pnpm start` to run both concurrently
