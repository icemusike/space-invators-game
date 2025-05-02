export class Enemy {
  constructor(grid, row, col, type) {
    this.grid = grid;
    this.game = grid.game;
    this.row = row;
    this.col = col;
    this.type = type;
    this.width = 40;
    this.height = 30;
    this.x = 0;
    this.y = 0;
    this.markedForDeletion = false;
    
    // Different enemy types have different colors and point values
    switch (type) {
      case 0: // Top row - highest points
        this.color = '#ff0000';
        this.points = 30;
        break;
      case 1: // Middle rows
        this.color = '#ff00ff';
        this.points = 20;
        break;
      default: // Bottom rows
        this.color = '#00ffff';
        this.points = 10;
    }
    
    // Animation
    this.frame = 0;
    this.maxFrame = 1;
    this.animationTimer = 0;
    this.animationInterval = 500; // ms
  }
  
  update(deltaTime) {
    // Animation
    this.animationTimer += deltaTime;
    if (this.animationTimer > this.animationInterval) {
      this.frame = this.frame === 0 ? 1 : 0;
      this.animationTimer = 0;
    }
  }
  
  draw() {
    const ctx = this.game.ctx;
    ctx.fillStyle = this.color;
    
    if (this.frame === 0) {
      // First frame
      this.drawEnemyFrame1(ctx);
    } else {
      // Second frame
      this.drawEnemyFrame2(ctx);
    }
  }
  
  drawEnemyFrame1(ctx) {
    // Body
    ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
    
    // Tentacles
    ctx.fillRect(this.x, this.y + 15, 5, 10);
    ctx.fillRect(this.x + this.width - 5, this.y + 15, 5, 10);
    
    // Eyes
    ctx.fillRect(this.x + 10, this.y, 5, 5);
    ctx.fillRect(this.x + this.width - 15, this.y, 5, 5);
  }
  
  drawEnemyFrame2(ctx) {
    // Body
    ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
    
    // Tentacles (moved)
    ctx.fillRect(this.x, this.y + 5, 5, 10);
    ctx.fillRect(this.x + this.width - 5, this.y + 5, 5, 10);
    
    // Eyes
    ctx.fillRect(this.x + 10, this.y, 5, 5);
    ctx.fillRect(this.x + this.width - 15, this.y, 5, 5);
  }
  
  checkCollision(projectile) {
    return (
      projectile.x < this.x + this.width &&
      projectile.x + projectile.width > this.x &&
      projectile.y < this.y + this.height &&
      projectile.y + projectile.height > this.y
    );
  }
}

export class EnemyGrid {
  constructor(game) {
    this.game = game;
    this.rows = 5;
    this.cols = 11;
    this.enemies = [];
    this.width = 0;
    this.height = 0;
    this.x = 50;
    this.y = 50;
    this.speedX = 20;
    this.speedY = 20;
    this.direction = 1; // 1 for right, -1 for left
    this.moveTimer = 0;
    this.moveInterval = 1000; // ms - will decrease as enemies are destroyed
    
    this.initialize();
  }
  
  initialize() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        // Determine enemy type based on row
        let type;
        if (row === 0) type = 0;
        else if (row < 3) type = 1;
        else type = 2;
        
        this.enemies.push(new Enemy(this, row, col, type));
      }
    }
    
    this.calculateDimensions();
  }
  
  calculateDimensions() {
    if (this.enemies.length === 0) return;
    
    const enemyWidth = this.enemies[0].width;
    const enemyHeight = this.enemies[0].height;
    const horizontalSpacing = 10;
    const verticalSpacing = 10;
    
    this.width = this.cols * (enemyWidth + horizontalSpacing) - horizontalSpacing;
    this.height = this.rows * (enemyHeight + verticalSpacing) - verticalSpacing;
    
    // Update enemy positions
    this.enemies.forEach(enemy => {
      enemy.x = this.x + enemy.col * (enemyWidth + horizontalSpacing);
      enemy.y = this.y + enemy.row * (enemyHeight + verticalSpacing);
    });
  }
  
  update(deltaTime) {
    // Update movement timer
    this.moveTimer += deltaTime;
    
    // Move enemies
    if (this.moveTimer > this.moveInterval) {
      this.moveEnemies();
      this.moveTimer = 0;
      
      // Play movement sound
      this.game.soundManager.play('enemyMove');
    }
    
    // Update individual enemies
    this.enemies.forEach(enemy => enemy.update(deltaTime));
    
    // Adjust movement speed based on number of enemies
    const remainingEnemies = this.enemies.length;
    const totalEnemies = this.rows * this.cols;
    const percentRemaining = remainingEnemies / totalEnemies;
    
    // Speed up as enemies are destroyed
    this.moveInterval = Math.max(100, 1000 * percentRemaining);
  }
  
  moveEnemies() {
    let moveDown = false;
    
    // Check if grid should change direction
    if (this.direction > 0) { // Moving right
      const rightmostEnemy = this.getRightmostEnemy();
      if (rightmostEnemy && rightmostEnemy.x + rightmostEnemy.width + this.speedX > this.game.width) {
        this.direction = -1;
        moveDown = true;
      }
    } else { // Moving left
      const leftmostEnemy = this.getLeftmostEnemy();
      if (leftmostEnemy && leftmostEnemy.x - this.speedX < 0) {
        this.direction = 1;
        moveDown = true;
      }
    }
    
    // Move enemies
    if (moveDown) {
      this.y += this.speedY;
    } else {
      this.x += this.speedX * this.direction;
    }
    
    // Update enemy positions
    this.calculateDimensions();
  }
  
  draw() {
    this.enemies.forEach(enemy => enemy.draw());
  }
  
  checkProjectileCollision(projectile) {
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (enemy.checkCollision(projectile)) {
        // Mark enemy and projectile for deletion
        enemy.markedForDeletion = true;
        projectile.markedForDeletion = true;
        
        // Add score
        this.game.score += enemy.points;
        this.game.updateScore();
        
        // Create explosion
        this.game.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        
        // Play sound
        this.game.soundManager.play('enemyHit');
        
        // Remove enemy from array
        this.enemies.splice(i, 1);
        
        // Recalculate grid dimensions
        this.calculateDimensions();
        
        return true;
      }
    }
    return false;
  }
  
  getRandomBottomEnemy() {
    if (this.enemies.length === 0) return null;
    
    // Group enemies by column
    const columns = {};
    this.enemies.forEach(enemy => {
      if (!columns[enemy.col]) columns[enemy.col] = [];
      columns[enemy.col].push(enemy);
    });
    
    // Get bottom enemies from each column
    const bottomEnemies = [];
    for (const col in columns) {
      const colEnemies = columns[col];
      const bottomEnemy = colEnemies.reduce((bottom, current) => {
        return current.row > bottom.row ? current : bottom;
      });
      bottomEnemies.push(bottomEnemy);
    }
    
    // Return a random bottom enemy
    if (bottomEnemies.length === 0) return null;
    return bottomEnemies[Math.floor(Math.random() * bottomEnemies.length)];
  }
  
  getLeftmostEnemy() {
    if (this.enemies.length === 0) return null;
    return this.enemies.reduce((leftmost, current) => {
      return current.x < leftmost.x ? current : leftmost;
    });
  }
  
  getRightmostEnemy() {
    if (this.enemies.length === 0) return null;
    return this.enemies.reduce((rightmost, current) => {
      return current.x + current.width > rightmost.x + rightmost.width ? current : rightmost;
    });
  }
  
  isEmpty() {
    return this.enemies.length === 0;
  }
  
  reachedBottom() {
    if (this.enemies.length === 0) return false;
    
    const bottomEnemy = this.enemies.reduce((bottom, current) => {
      return current.y + current.height > bottom.y + bottom.height ? current : bottom;
    });
    
    return bottomEnemy.y + bottomEnemy.height > this.game.player.y;
  }
}
