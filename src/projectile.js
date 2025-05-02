export class Projectile {
  constructor(game, x, y, speedX, speedY, width, height, color, type) {
    this.game = game;
    this.x = x - width / 2;
    this.y = y;
    this.speedX = speedX;
    this.speedY = speedY;
    this.width = width;
    this.height = height;
    this.color = color;
    this.type = type;
    this.markedForDeletion = false;
  }
  
  update(deltaTime) {
    // Move projectile
    this.x += this.speedX;
    this.y += this.speedY;
    
    // Check if out of bounds
    if (
      this.y < 0 ||
      this.y > this.game.height ||
      this.x < 0 ||
      this.x > this.game.width
    ) {
      this.markedForDeletion = true;
    }
  }
  
  draw() {
    const ctx = this.game.ctx;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}
