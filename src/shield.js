export class Shield {
  constructor(game, x, y, width) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = 30;
    this.color = '#00ff00';
    this.blocks = [];
    this.blockSize = 5;
    
    this.createBlocks();
  }
  
  createBlocks() {
    const rows = this.height / this.blockSize;
    const cols = this.width / this.blockSize;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Create shield shape (arch)
        if (this.isPartOfShield(row, col, rows, cols)) {
          this.blocks.push({
            x: this.x + col * this.blockSize,
            y: this.y + row * this.blockSize,
            width: this.blockSize,
            height: this.blockSize,
            health: 3 // blocks can take 3 hits
          });
        }
      }
    }
  }
  
  isPartOfShield(row, col, rows, cols) {
    // Create an arch shape
    if (row < rows / 2) {
      return true;
    } else {
      // Create a gap in the bottom half
      const middleCol = cols / 2;
      const distance = Math.abs(col - middleCol);
      const gapWidth = cols / 4;
      
      return distance > gapWidth;
    }
  }
  
  update() {
    // Nothing to update for shields
  }
  
  draw() {
    const ctx = this.game.ctx;
    
    this.blocks.forEach(block => {
      // Color based on health
      switch (block.health) {
        case 3:
          ctx.fillStyle = '#00ff00'; // Green
          break;
        case 2:
          ctx.fillStyle = '#aaff00'; // Yellow-green
          break;
        case 1:
          ctx.fillStyle = '#ffaa00'; // Orange
          break;
      }
      
      ctx.fillRect(block.x, block.y, block.width, block.height);
    });
  }
  
  checkCollision(projectile) {
    for (let i = 0; i < this.blocks.length; i++) {
      const block = this.blocks[i];
      
      if (
        projectile.x < block.x + block.width &&
        projectile.x + projectile.width > block.x &&
        projectile.y < block.y + block.height &&
        projectile.y + projectile.height > block.y
      ) {
        // Reduce block health
        block.health--;
        
        // Remove block if health is depleted
        if (block.health <= 0) {
          this.blocks.splice(i, 1);
        }
        
        return true;
      }
    }
    
    return false;
  }
}
