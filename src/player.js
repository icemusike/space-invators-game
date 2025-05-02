export class Player {
  constructor(game) {
    this.game = game;
    this.width = 60;
    this.height = 30;
    this.x = this.game.width / 2 - this.width / 2;
    this.y = this.game.height - this.height - 30;
    this.speed = 5;
    this.color = '#00ff00';
  }
  
  update(deltaTime) {
    // Movement
    if (this.game.keys.left) {
      this.x = Math.max(0, this.x - this.speed);
    }
    if (this.game.keys.right) {
      this.x = Math.min(this.game.width - this.width, this.x + this.speed);
    }
  }
  
  draw() {
    const ctx = this.game.ctx;
    
    // Draw player ship (cannon base)
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y + 10, this.width, this.height - 10);
    
    // Draw cannon
    ctx.fillRect(this.x + this.width / 2 - 5, this.y, 10, 15);
  }
  
  checkCollision(projectile) {
    return (
      projectile.x < this.x + this.width &&
      projectile.x + projectile.width > this.x &&
      projectile.y < this.y + this.height &&
      projectile.y + projectile.height > this.y
    );
  }
  
  reset() {
    this.x = this.game.width / 2 - this.width / 2;
  }
}
