export class Player {
  constructor(game) {
    this.game = game;
    this.width = 60;
    this.height = 30;
    this.x = this.game.width / 2 - this.width / 2;
    this.y = this.game.height - this.height - 30;
    this.speed = 5;
    this.color = '#00ff00';
    this.invincible = false;
    this.invincibilityTimer = 0;
    this.invincibilityDuration = 1500; // ms
    this.blinkInterval = 150; // ms for blinking effect
    this.visible = true;
  }
  
  update(deltaTime) {
    // Movement
    if (this.game.keys.left) {
      this.x = Math.max(0, this.x - this.speed);
    }
    if (this.game.keys.right) {
      this.x = Math.min(this.game.width - this.width, this.x + this.speed);
    }
    
    // Handle invincibility
    if (this.invincible) {
      this.invincibilityTimer += deltaTime;
      
      // Blink effect
      if (this.invincibilityTimer % this.blinkInterval < this.blinkInterval / 2) {
        this.visible = true;
      } else {
        this.visible = false;
      }
      
      // End invincibility
      if (this.invincibilityTimer >= this.invincibilityDuration) {
        this.invincible = false;
        this.visible = true;
        this.invincibilityTimer = 0;
      }
    }
  }
  
  draw() {
    if (!this.visible) return;
    
    const ctx = this.game.ctx;
    
    // Draw player ship (cannon base)
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y + 10, this.width, this.height - 10);
    
    // Draw cannon
    ctx.fillRect(this.x + this.width / 2 - 5, this.y, 10, 15);
  }
  
  checkCollision(projectile) {
    if (this.invincible) return false;
    
    return (
      projectile.x < this.x + this.width &&
      projectile.x + projectile.width > this.x &&
      projectile.y < this.y + this.height &&
      projectile.y + projectile.height > this.y
    );
  }
  
  reset() {
    this.x = this.game.width / 2 - this.width / 2;
    this.invincible = true;
    this.invincibilityTimer = 0;
    this.visible = true;
  }
}
