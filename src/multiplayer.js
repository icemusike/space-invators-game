import { io } from 'socket.io-client';

export class MultiplayerManager {
  constructor(game) {
    this.game = game;
    this.socket = null;
    this.connected = false;
    this.username = '';
    this.gameId = null;
    this.isHost = false;
    this.opponent = null;
    this.opponentScore = 0;
    this.availableGames = [];
    this.leaderboard = [];
    this.gameStarted = false;
    this.matchComplete = false;
  }
  
  connect() {
    // Connect to the server
    const serverUrl = import.meta.env.PROD 
      ? window.location.origin 
      : 'http://localhost:3000';
      
    this.socket = io(serverUrl);
    
    // Set up event listeners
    this.setupSocketListeners();
    
    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        this.connected = true;
        console.log('Connected to server');
        resolve();
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });
    });
  }
  
  setupSocketListeners() {
    // Game list updates
    this.socket.on('gamesList', (games) => {
      this.availableGames = games.filter(game => game.status === 'waiting');
      this.game.updateLobbyUI();
    });
    
    // Game created
    this.socket.on('gameCreated', (gameData) => {
      this.gameId = gameData.id;
      this.isHost = true;
      this.game.showWaitingScreen();
    });
    
    // Player joined
    this.socket.on('playerJoined', (data) => {
      if (data.player.id !== this.socket.id) {
        this.opponent = data.player;
        this.game.showMessage(`${data.player.username} joined the game!`, 2000);
      }
    });
    
    // Game ready
    this.socket.on('gameReady', (gameData) => {
      // Find opponent
      this.opponent = gameData.players.find(p => p.id !== this.socket.id);
      
      if (this.isHost) {
        this.game.showStartButton();
      } else {
        this.game.showMessage('Game ready! Waiting for host to start...', 0);
      }
    });
    
    // Game started
    this.socket.on('gameStarted', () => {
      this.gameStarted = true;
      this.game.startMultiplayerGame();
    });
    
    // Opponent score update
    this.socket.on('opponentScore', (data) => {
      this.opponentScore = data.score;
      this.game.updateOpponentScore(data.score);
    });
    
    // Opponent game over
    this.socket.on('opponentGameOver', (data) => {
      this.game.showMessage(`${data.username} finished with score: ${data.score}`, 3000);
    });
    
    // Match complete
    this.socket.on('matchComplete', (data) => {
      this.matchComplete = true;
      
      // Sort players by score
      const sortedPlayers = [...data.players].sort((a, b) => b.score - a.score);
      
      // Determine winner
      const winner = sortedPlayers[0];
      const isWinner = winner.id === this.socket.id;
      
      // Show results
      if (sortedPlayers[0].score === sortedPlayers[1].score) {
        this.game.showMessage('Match ended in a tie!', 0);
      } else {
        this.game.showMessage(
          isWinner 
            ? 'You won the match!' 
            : `${winner.username} won the match!`,
          0
        );
      }
      
      // Show match results
      this.game.showMatchResults(sortedPlayers);
    });
    
    // Player left
    this.socket.on('playerLeft', (data) => {
      this.game.showMessage(`${data.username} left the game`, 3000);
      this.opponent = null;
    });
    
    // Game ended
    this.socket.on('gameEnded', (data) => {
      this.gameId = null;
      this.isHost = false;
      this.opponent = null;
      this.gameStarted = false;
      this.game.showMessage(`Game ended: ${data.reason}`, 3000);
      this.game.showLobby();
    });
    
    // Leaderboard update
    this.socket.on('leaderboardUpdate', (leaderboard) => {
      this.leaderboard = leaderboard;
      this.game.updateLeaderboardUI();
    });
    
    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.game.showMessage(`Error: ${error.message}`, 3000);
    });
  }
  
  register(username) {
    this.username = username;
    this.socket.emit('register', { username });
  }
  
  createGame() {
    this.socket.emit('createGame');
  }
  
  joinGame(gameId) {
    this.gameId = gameId;
    this.socket.emit('joinGame', gameId);
  }
  
  startGame() {
    if (this.gameId && this.isHost) {
      this.socket.emit('startGame', this.gameId);
    }
  }
  
  updateScore(score) {
    this.socket.emit('updateScore', { score });
  }
  
  gameOver(score) {
    this.socket.emit('gameOver', { score });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
    }
  }
}
