import { Player } from './player.js';
import { EnemyGrid } from './enemies.js';
import { Projectile } from './projectile.js';
import { SoundManager } from './soundManager.js';
import { Particle } from './particles.js';
import { Shield } from './shield.js';
import { UFO } from './ufo.js';

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
    
    // Controls
    this.keys = {
      left: false,
      right: false,
      space: false
    };
    
    this.setupEventListeners();
    this.createShields();
  }
  
  setupEventListeners() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
      if (e.key === ' ' && !this.keys.space) {
        this.keys.space = true;
        if (!this.gameStarted) {
          this.gameStarted = true;
          this.hideMessage();
        } else if (this.gameOver) {
          this.reset();
        } else if (!this.paused) {
          this.playerShoot();
        }
      }
      if (e.key === 'p') this.togglePause();
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
