export class UFO {
  constructor(game) {
    this.game = game;
    this.width = 60;
    this.height = 20;
    this.x = -this.width;
    this.y = 30;
    this.speed = 2;
    this.color = '#ff0000';
    this.markedForDeletion = false;
    
    // Animation
    this.frame = 0;
    this.maxFrame = 1;
    this.animationTimer = 0;
    this.animationInterval = 200; // ms
  }
  
  update(deltaTime) {
    // Move UFO
    this.x += this.speed;
    
    // Check if out of bounds
    if (this.x > this.game.width) {
      this.markedForDeletion = true;
    }
    
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
    
    // Draw UFO body
    ctx.fillRect(this.x + 10, this.y, this.width - 20, this.height / 2);
    
    // Draw UFO dome
    ctx.beginPath();
    ctx.ellipse(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width / 2,
      this.height / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw lights (blinking)
    if (this.frame === 0) {
      ctx.fillStyle = '#ffff00';
    } else {
      ctx.fillStyle = '#00ffff';
    }
    
    ctx.fillRect(this.x + 15, this.y + this.height - 5, 5, 5);
    ctx.fillRect(this.x + this.width - 20, this.y + this.height - 5, 5, 5);
    ctx.fillRect(this.x + this.width / 2 - 2.5, this.y + this.height - 5, 5, 5);
  }
  
  checkCollision(projectile) {
    return (
      projectile.x < this.x + this.width &&
      projectile.x + projectile.width > this.x &&
      projectile.y < this.y + this.height &&
      projectile.y + projectile.height > this.y
    );
  }
  
  hit() {
    this.markedForDeletion = true;
  }
}
