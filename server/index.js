import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models
import { Leaderboard } from './models/leaderboard.js';
import { ActiveGame } from './models/activeGame.js';

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Track active games and players
const activeGames = new Map();
const activePlayers = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Handle player registration
  socket.on('register', async (playerData) => {
    const { username } = playerData;
    
    // Store player info
    activePlayers.set(socket.id, {
      id: socket.id,
      username,
      score: 0,
      gameId: null
    });
    
    // Send available games to player
    socket.emit('gamesList', Array.from(activeGames.values()));
    
    // Send leaderboard data
    const leaderboard = await Leaderboard.find().sort({ score: -1 }).limit(10);
    socket.emit('leaderboardUpdate', leaderboard);
  });
  
  // Handle game creation
  socket.on('createGame', () => {
    const player = activePlayers.get(socket.id);
    if (!player) return;
    
    const gameId = `game_${Date.now()}`;
    const newGame = {
      id: gameId,
      host: socket.id,
      hostUsername: player.username,
      players: [player],
      status: 'waiting',
      createdAt: new Date()
    };
    
    // Update player's game ID
    player.gameId = gameId;
    activePlayers.set(socket.id, player);
    
    // Store game
    activeGames.set(gameId, newGame);
    
    // Join socket room for this game
    socket.join(gameId);
    
    // Notify player
    socket.emit('gameCreated', newGame);
    
    // Update all clients with new game list
    io.emit('gamesList', Array.from(activeGames.values()));
    
    // Save to database
    const activeGame = new ActiveGame({
      gameId,
      host: player.username,
      players: [{ id: player.id, username: player.username }],
      status: 'waiting'
    });
    activeGame.save();
  });
  
  // Handle joining a game
  socket.on('joinGame', (gameId) => {
    const game = activeGames.get(gameId);
    const player = activePlayers.get(socket.id);
    
    if (!game || !player) return;
    if (game.status !== 'waiting') {
      socket.emit('error', { message: 'Game already started' });
      return;
    }
    
    // Add player to game
    player.gameId = gameId;
    game.players.push(player);
    activePlayers.set(socket.id, player);
    
    // Join socket room
    socket.join(gameId);
    
    // Notify all players in the game
    io.to(gameId).emit('playerJoined', {
      gameId,
      player: { id: player.id, username: player.username }
    });
    
    // Update game status if we have 2 players
    if (game.players.length >= 2) {
      game.status = 'ready';
      io.to(gameId).emit('gameReady', game);
    }
    
    // Update game in map
    activeGames.set(gameId, game);
    
    // Update database
    ActiveGame.findOneAndUpdate(
      { gameId },
      { 
        $push: { players: { id: player.id, username: player.username } },
        $set: { status: game.status }
      }
    ).exec();
  });
  
  // Handle starting a game
  socket.on('startGame', (gameId) => {
    const game = activeGames.get(gameId);
    if (!game) return;
    
    // Only host can start the game
    if (game.host !== socket.id) {
      socket.emit('error', { message: 'Only host can start the game' });
      return;
    }
    
    game.status = 'playing';
    activeGames.set(gameId, game);
    
    // Notify all players
    io.to(gameId).emit('gameStarted', game);
    
    // Update database
    ActiveGame.findOneAndUpdate(
      { gameId },
      { $set: { status: 'playing' } }
    ).exec();
  });
  
  // Handle score updates
  socket.on('updateScore', (data) => {
    const { score } = data;
    const player = activePlayers.get(socket.id);
    if (!player) return;
    
    // Update player score
    player.score = score;
    activePlayers.set(socket.id, player);
    
    // If player is in a game, broadcast score to other players
    if (player.gameId) {
      socket.to(player.gameId).emit('opponentScore', {
        playerId: socket.id,
        username: player.username,
        score
      });
    }
  });
  
  // Handle game over
  socket.on('gameOver', async (data) => {
    const { score } = data;
    const player = activePlayers.get(socket.id);
    if (!player) return;
    
    // Save score to leaderboard
    const leaderboardEntry = new Leaderboard({
      username: player.username,
      score,
      date: new Date()
    });
    
    await leaderboardEntry.save();
    
    // Get updated leaderboard
    const leaderboard = await Leaderboard.find().sort({ score: -1 }).limit(10);
    
    // Broadcast to all players
    io.emit('leaderboardUpdate', leaderboard);
    
    // If in multiplayer game, notify other player
    if (player.gameId) {
      const game = activeGames.get(player.gameId);
      if (game) {
        socket.to(player.gameId).emit('opponentGameOver', {
          playerId: socket.id,
          username: player.username,
          score
        });
        
        // Check if both players are done
        const allPlayersDone = game.players.every(p => 
          activePlayers.get(p.id)?.gameOver || p.id === socket.id
        );
        
        if (allPlayersDone) {
          // End the game
          io.to(player.gameId).emit('matchComplete', {
            players: game.players.map(p => ({
              id: p.id,
              username: p.username,
              score: activePlayers.get(p.id)?.score || 0
            }))
          });
          
          // Remove game
          activeGames.delete(player.gameId);
          
          // Update database
          await ActiveGame.findOneAndDelete({ gameId: player.gameId });
        }
      }
    }
    
    // Mark player as game over
    player.gameOver = true;
    activePlayers.set(socket.id, player);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    const player = activePlayers.get(socket.id);
    if (!player) return;
    
    // If player was in a game, notify other players
    if (player.gameId) {
      const game = activeGames.get(player.gameId);
      if (game) {
        // Notify other players in the game
        socket.to(player.gameId).emit('playerLeft', {
          playerId: socket.id,
          username: player.username
        });
        
        // If this was the host, end the game
        if (game.host === socket.id) {
          io.to(player.gameId).emit('gameEnded', { reason: 'Host left' });
          activeGames.delete(player.gameId);
          ActiveGame.findOneAndDelete({ gameId: player.gameId }).exec();
        } else {
          // Remove player from game
          game.players = game.players.filter(p => p.id !== socket.id);
          activeGames.set(player.gameId, game);
          
          // Update database
          ActiveGame.findOneAndUpdate(
            { gameId: player.gameId },
            { $pull: { players: { id: socket.id } } }
          ).exec();
        }
      }
    }
    
    // Remove player
    activePlayers.delete(socket.id);
    console.log('User disconnected:', socket.id);
  });
});

// API Routes
// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find().sort({ score: -1 }).limit(10);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active games
app.get('/api/games', (req, res) => {
  res.json(Array.from(activeGames.values()));
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
