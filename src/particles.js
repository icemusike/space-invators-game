export class Particle {
  constructor(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.size = Math.random() * 3 + 1;
    this.speedX = Math.random() * 6 - 3;
    this.speedY = Math.random() * 6 - 3;
    this.color = `hsl(${Math.random() * 60 + 300}, 100%, 50%)`;
    this.markedForDeletion = false;
    this.ttl = 30; // time to live in frames
  }
  
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.ttl--;
    
    if (this.ttl <= 0) {
      this.markedForDeletion = true;
    }
  }
  
  draw() {
    const ctx = this.game.ctx;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}
