import { Player } from './player.js';
import { EnemyGrid } from './enemies.js';
import { Projectile } from './projectile.js';
import { SoundManager } from './soundManager.js';
import { Particle } from './particles.js';
import { Shield } from './shield.js';
import { UFO } from './ufo.js';
import { MultiplayerManager } from './multiplayer.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.scoreElement = document.getElementById('score');
    this.livesElement = document.getElementById('lives');
    this.messageElement = document.getElementById('gameMessage');
    
    // Game dimensions
    this.width = 600;
    this.height = 700;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    // Game state
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.paused = false;
    this.gameStarted = false;
    this.isMultiplayer = false;
    
    // Game objects
    this.player = new Player(this);
    this.enemyGrid = new EnemyGrid(this);
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.particles = [];
    this.shields = [];
    this.ufo = null;
    
    // Timing
    this.lastTime = 0;
    this.enemyShootInterval = 1000; // ms
    this.lastEnemyShot = 0;
    this.ufoSpawnInterval = 15000; // ms
    this.lastUfoSpawn = 0;
    
    // Sound
    this.soundManager = new SoundManager();
    
    // Multiplayer
    this.multiplayerManager = new MultiplayerManager(this);
    
    // Controls
    this.keys = {
      left: false,
      right: false,
      space: false
    };
    
    // UI Elements
    this.createUIElements();
    
    this.setupEventListeners();
    this.createShields();
  }
  
  createUIElements() {
    // Create multiplayer UI container
    this.multiplayerUI = document.createElement('div');
    this.multiplayerUI.id = 'multiplayerUI';
    document.getElementById('app').appendChild(this.multiplayerUI);
    
    // Create opponent score display
    this.opponentScoreElement = document.createElement('div');
    this.opponentScoreElement.id = 'opponentScore';
    this.opponentScoreElement.style.display = 'none';
    document.getElementById('ui').appendChild(this.opponentScoreElement);
    
    // Create leaderboard container
    this.leaderboardElement = document.createElement('div');
    this.leaderboardElement.id = 'leaderboard';
    this.leaderboardElement.innerHTML = '<h2>Global Leaderboard</h2><div id="leaderboardEntries"></div>';
    document.getElementById('app').appendChild(this.leaderboardElement);
    
    // Style the new elements
    const style = document.createElement('style');
    style.textContent = `
      #multiplayerUI {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.8);
        border: 2px solid #00ff00;
        padding: 20px;
        z-index: 100;
        display: none;
        color: #00ff00;
        text-align: center;
        min-width: 300px;
      }
      
      #multiplayerUI input {
        background-color: #000;
        border: 1px solid #00ff00;
        color: #00ff00;
        padding: 8px;
        margin: 10px 0;
        width: 100%;
      }
      
      #multiplayerUI button {
        background-color: #000;
        border: 1px solid #00ff00;
        color: #00ff00;
        padding: 8px 16px;
        margin: 5px;
        cursor: pointer;
      }
      
      #multiplayerUI button:hover {
        background-color: #003300;
      }
      
      #gamesList {
        max-height: 200px;
        overflow-y: auto;
        margin: 10px 0;
      }
      
      .gameItem {
        border: 1px solid #00ff00;
        padding: 8px;
        margin: 5px 0;
        cursor: pointer;
      }
      
      .gameItem:hover {
        background-color: #003300;
      }
      
      #opponentScore {
        position: absolute;
        top: 10px;
        right: 10px;
        color: #ff0000;
      }
      
      #leaderboard {
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: rgba(0, 0, 0, 0.7);
        border: 1px solid #00ff00;
        padding: 10px;
        max-width: 200px;
        max-height: 300px;
        overflow-y: auto;
        display: none;
      }
      
      #leaderboard h2 {
        color: #00ff00;
        font-size: 16px;
        margin-top: 0;
        text-align: center;
      }
      
      .leaderboardEntry {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
        color: #00ff00;
      }
      
      #matchResults {
        margin-top: 20px;
      }
      
      .resultEntry {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
        padding: 5px;
      }
      
      .winner {
        color: #ffff00;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
  }
  
  setupEventListeners() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
      if (e.key === ' ' && !this.keys.space) {
        this.keys.space = true;
        if (!this.gameStarted) {
          this.showMainMenu();
        } else if (this.gameOver) {
          this.reset();
        } else if (!this.paused) {
          this.playerShoot();
        }
      }
      if (e.key === 'p') this.togglePause();
      if (e.key === 'l') this.toggleLeaderboard();
    });
    
    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = false;
      if (e.key === ' ') this.keys.space = false;
    });
  }
  
  createShields() {
    const shieldCount = 4;
    const shieldWidth = 80;
    const spacing = (this.width - (shieldCount * shieldWidth)) / (shieldCount + 1);
    const y = this.height - 150;
    
    for (let i = 0; i < shieldCount; i++) {
      const x = spacing + i * (shieldWidth + spacing);
      this.shields.push(new Shield(this, x, y, shieldWidth));
    }
  }
  
  start() {
    this.showMessage('SPACE INVADERS\\n\\nPRESS SPACE TO START\\n\\nARROW KEYS TO MOVE\\nSPACE TO SHOOT');
    this.animate(0);
  }
  
  showMainMenu() {
    this.hideMessage();
    
    const menuHTML = `
      <h2>SPACE INVADERS</h2>
      <button id="singlePlayerBtn">Single Player</button>
      <button id="multiplayerBtn">Multiplayer</button>
    `;
    
    this.multiplayerUI.innerHTML = menuHTML;
    this.multiplayerUI.style.display = 'block';
    
    document.getElementById('singlePlayerBtn').addEventListener('click', () => {
      this.startSinglePlayerGame();
    });
    
    document.getElementById('multiplayerBtn').addEventListener('click', () => {
      this.setupMultiplayer();
    });
  }
  
  startSinglePlayerGame() {
    this.multiplayerUI.style.display = 'none';
    this.gameStarted = true;
    this.isMultiplayer = false;
    this.reset();
  }
  
  async setupMultiplayer() {
    try {
      // Connect to server
      await this.multiplayerManager.connect();
      
      // Show login screen
      const loginHTML = `
        <h2>Enter Your Username</h2>
        <input type="text" id="usernameInput" placeholder="Username" maxlength="15">
        <button id="loginBtn">Continue</button>
      `;
      
      this.multiplayerUI.innerHTML = loginHTML;
      
      document.getElementById('loginBtn').addEventListener('click', () => {
        const username = document.getElementById('usernameInput').value.trim();
        if (username) {
          this.multiplayerManager.register(username);
          this.showLobby();
        }
      });
    } catch (error) {
      this.showMessage('Failed to connect to server. Please try again.', 3000);
      setTimeout(() => this.showMainMenu(), 3000);
    }
  }
  
  showLobby() {
    const lobbyHTML = `
      <h2>Game Lobby</h2>
      <button id="createGameBtn">Create New Game</button>
      <div id="gamesList">
        <h3>Available Games</h3>
        <div id="gamesContainer"></div>
      </div>
      <button id="refreshBtn">Refresh Games</button>
      <button id="backBtn">Back to Menu</button>
    `;
    
    this.multiplayerUI.innerHTML = lobbyHTML;
    
    document.getElementById('createGameBtn').addEventListener('click', () => {
      this.multiplayerManager.createGame();
    });
    
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.updateLobbyUI();
    });
    
    document.getElementById('backBtn').addEventListener('click', () => {
      this.showMainMenu();
    });
    
    this.updateLobbyUI();
  }
  
  updateLobbyUI() {
    const gamesContainer = document.getElementById('gamesContainer');
    if (!gamesContainer) return;
    
    if (this.multiplayerManager.availableGames.length === 0) {
      gamesContainer.innerHTML = '<p>No games available</p>';
      return;
    }
    
    gamesContainer.innerHTML = '';
    this.multiplayerManager.availableGames.forEach(game => {
      const gameElement = document.createElement('div');
      gameElement.className = 'gameItem';
      gameElement.innerHTML = `<p>Host: ${game.hostUsername}</p>`;
      gameElement.addEventListener('click', () => {
        this.multiplayerManager.joinGame(game.id);
      });
      
      gamesContainer.appendChild(gameElement);
    });
  }
  
  showWaitingScreen() {
    const waitingHTML = `
      <h2>Waiting for Player</h2>
      <p>Game ID: ${this.multiplayerManager.gameId}</p>
      <p>Waiting for another player to join...</p>
      <button id="cancelBtn">Cancel</button>
    `;
    
    this.multiplayerUI.innerHTML = waitingHTML;
    
    document.getElementById('cancelBtn').addEventListener('click', () => {
      this.showLobby();
    });
  }
  
  showStartButton() {
    const startHTML = `
      <h2>Game Ready</h2>
      <p>Player: ${this.multiplayerManager.opponent.username} has joined</p>
      <button id="startGameBtn">Start Game</button>
      <button id="cancelBtn">Cancel</button>
    `;
    
    this.multiplayerUI.innerHTML = startHTML;
    
    document.getElementById('startGameBtn').addEventListener('click', () => {
      this.multiplayerManager.startGame();
    });
    
    document.getElementById('cancelBtn').addEventListener('click', () => {
      this.showLobby();
    });
  }
  
  startMultiplayerGame() {
    this.multiplayerUI.style.display = 'none';
    this.gameStarted = true;
    this.isMultiplayer = true;
    this.reset();
    
    // Show opponent score
    this.opponentScoreElement.textContent = `Opponent: 0`;
    this.opponentScoreElement.style.display = 'block';
  }
  
  updateOpponentScore(score) {
    if (this.opponentScoreElement) {
      this.opponentScoreElement.textContent = `Opponent: ${score}`;
    }
  }
  
  showMatchResults(players) {
    const resultsHTML = `
      <h2>Match Results</h2>
      <div id="matchResults">
        ${players.map((player, index) => `
          <div class="resultEntry ${index === 0 ? 'winner' : ''}">
            <span>${player.username}</span>
            <span>${player.score}</span>
          </div>
        `).join('')}
      </div>
      <button id="backToLobbyBtn">Back to Lobby</button>
    `;
    
    this.multiplayerUI.innerHTML = resultsHTML;
    this.multiplayerUI.style.display = 'block';
    
    document.getElementById('backToLobbyBtn').addEventListener('click', () => {
      this.showLobby();
    });
  }
  
  updateLeaderboardUI() {
    const leaderboardEntries = document.getElementById('leaderboardEntries');
    if (!leaderboardEntries) return;
    
    leaderboardEntries.innerHTML = '';
    
    this.multiplayerManager.leaderboard.forEach((entry, index) => {
      const entryElement = document.createElement('div');
      entryElement.className = 'leaderboardEntry';
      entryElement.innerHTML = `
        <span>${index + 1}. ${entry.username}</span>
        <span>${entry.score}</span>
      `;
      
      leaderboardEntries.appendChild(entryElement);
    });
  }
  
  toggleLeaderboard() {
    if (this.leaderboardElement.style.display === 'none' || !this.leaderboardElement.style.display) {
      this.leaderboardElement.style.display = 'block';
    } else {
      this.leaderboardElement.style.display = 'none';
    }
  }
  
  animate(timeStamp) {
    const deltaTime = timeStamp - this.lastTime;
    this.lastTime = timeStamp;
    
    if (!this.paused && this.gameStarted && !this.gameOver) {
      this.update(deltaTime);
    }
    
    this.draw();
    requestAnimationFrame((time) => this.animate(time));
  }
  
  update(deltaTime) {
    // Update player
    this.player.update(deltaTime);
    
    // Update enemy grid
    this.enemyGrid.update(deltaTime);
    
    // Check if enemies reached the bottom
    if (this.enemyGrid.reachedBottom()) {
      this.lives = 0;
      this.gameOver = true;
      this.showMessage('GAME OVER\\n\\nPRESS SPACE TO RESTART');
      this.soundManager.play('gameOver');
      
      if (this.isMultiplayer) {
        this.multiplayerManager.gameOver(this.score);
      }
    }
    
    // Update UFO
    if (this.ufo) {
      this.ufo.update(deltaTime);
      if (this.ufo.markedForDeletion) {
        this.ufo = null;
      }
    } else {
      // Spawn new UFO
      this.lastUfoSpawn += deltaTime;
      if (this.lastUfoSpawn > this.ufoSpawnInterval) {
        this.spawnUFO();
        this.lastUfoSpawn = 0;
      }
    }
    
    // Update projectiles
    this.updateProjectiles(deltaTime);
    
    // Enemy shooting
    this.lastEnemyShot += deltaTime;
    if (this.lastEnemyShot > this.enemyShootInterval) {
      this.enemyShoot();
      this.lastEnemyShot = 0;
    }
    
    // Update particles
    this.particles = this.particles.filter(particle => !particle.markedForDeletion);
    this.particles.forEach(particle => particle.update());
    
    // Check if all enemies are defeated
    if (this.enemyGrid.isEmpty()) {
      this.nextLevel();
    }
    
    // Update multiplayer score
    if (this.isMultiplayer) {
      this.multiplayerManager.updateScore(this.score);
    }
  }
  
  updateProjectiles(deltaTime) {
    // Update player projectiles
    this.playerProjectiles = this.playerProjectiles.filter(projectile => !projectile.markedForDeletion);
    this.playerProjectiles.forEach(projectile => {
      projectile.update(deltaTime);
      
      // Check collision with enemies
      this.enemyGrid.checkProjectileCollision(projectile);
      
      // Check collision with UFO
      if (this.ufo && this.ufo.checkCollision(projectile)) {
        projectile.markedForDeletion = true;
        this.ufo.hit();
        this.score += 100;
        this.updateScore();
        this.createExplosion(this.ufo.x + this.ufo.width / 2, this.ufo.y + this.ufo.height / 2);
        this.soundManager.play('ufoHit');
      }
    });
    
    // Update enemy projectiles
    this.enemyProjectiles = this.enemyProjectiles.filter(projectile => !projectile.markedForDeletion);
    this.enemyProjectiles.forEach(projectile => {
      projectile.update(deltaTime);
      
      // Check collision with player
      if (this.player.checkCollision(projectile)) {
        projectile.markedForDeletion = true;
        this.playerHit();
      }
    });
    
    // Check projectile collision with shields
    this.shields.forEach(shield => {
      this.playerProjectiles.forEach(projectile => {
        if (shield.checkCollision(projectile)) {
          projectile.markedForDeletion = true;
        }
      });
      
      this.enemyProjectiles.forEach(projectile => {
        if (shield.checkCollision(projectile)) {
          projectile.markedForDeletion = true;
        }
      });
    });
  }
  
  playerShoot() {
    if (this.playerProjectiles.length < 1) { // Limit to 1 projectile at a time
      const projectile = new Projectile(
        this,
        this.player.x + this.player.width / 2,
        this.player.y,
        0, -10, // velocity
        4, 15,  // width, height
        '#00ff00',
        'player'
      );
      this.playerProjectiles.push(projectile);
      this.soundManager.play('playerShoot');
    }
  }
  
  enemyShoot() {
    const shooter = this.enemyGrid.getRandomBottomEnemy();
    if (shooter) {
      const projectile = new Projectile(
        this,
        shooter.x + shooter.width / 2,
        shooter.y + shooter.height,
        0, 5, // velocity
        4, 15, // width, height
        '#ff0000',
        'enemy'
      );
      this.enemyProjectiles.push(projectile);
      this.soundManager.play('enemyShoot');
    }
  }
  
  playerHit() {
    this.lives--;
    this.updateLives();
    this.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
    this.soundManager.play('playerHit');
    
    if (this.lives <= 0) {
      this.gameOver = true;
      this.showMessage('GAME OVER\\n\\nPRESS SPACE TO RESTART');
      this.soundManager.play('gameOver');
      
      if (this.isMultiplayer) {
        this.multiplayerManager.gameOver(this.score);
      }
    } else {
      // Reset player position
      this.player.reset();
    }
  }
  
  createExplosion(x, y) {
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(new Particle(this, x, y));
    }
  }
  
  spawnUFO() {
    this.ufo = new UFO(this);
    this.soundManager.play('ufoFlying');
  }
  
  nextLevel() {
    this.level++;
    this.enemyGrid = new EnemyGrid(this);
    this.enemyShootInterval = Math.max(300, 1000 - (this.level * 100)); // Increase difficulty
    this.showMessage(`LEVEL ${this.level}`, 2000);
    this.soundManager.play('levelUp');
  }
  
  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw stars (background)
    this.drawStars();
    
    // Draw game objects
    this.player.draw();
    this.enemyGrid.draw();
    this.playerProjectiles.forEach(projectile => projectile.draw());
    this.enemyProjectiles.forEach(projectile => projectile.draw());
    this.shields.forEach(shield => shield.draw());
    this.particles.forEach(particle => particle.draw());
    if (this.ufo) this.ufo.draw();
  }
  
  drawStars() {
    this.ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      const size = Math.random() < 0.8 ? 1 : 2;
      this.ctx.fillRect(x, y, size, size);
    }
  }
  
  updateScore() {
    this.scoreElement.textContent = `Score: ${this.score}`;
  }
  
  updateLives() {
    this.livesElement.textContent = `Lives: ${this.lives}`;
  }
  
  showMessage(text, duration = 0) {
    this.messageElement.innerHTML = text.replace(/\\n/g, '<br>');
    this.messageElement.style.display = 'block';
    
    if (duration > 0) {
      setTimeout(() => {
        this.hideMessage();
      }, duration);
    }
  }
  
  hideMessage() {
    this.messageElement.style.display = 'none';
  }
  
  togglePause() {
    this.paused = !this.paused;
    if (this.paused) {
      this.showMessage('PAUSED\\n\\nPRESS P TO CONTINUE');
    } else {
      this.hideMessage();
    }
  }
  
  reset() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.paused = false;
    this.gameStarted = true;
    
    this.player.reset();
    this.enemyGrid = new EnemyGrid(this);
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.particles = [];
    this.shields = [];
    this.ufo = null;
    
    this.createShields();
    this.updateScore();
    this.updateLives();
    this.hideMessage();
    
    this.enemyShootInterval = 1000;
    this.lastEnemyShot = 0;
    this.lastUfoSpawn = 0;
  }
}
