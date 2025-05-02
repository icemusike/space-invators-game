export class SoundManager {
  constructor() {
    this.sounds = {};
    this.muted = false;
    
    // Load sounds
    this.loadSounds();
  }
  
  loadSounds() {
    // Create audio context
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create oscillator-based sounds for retro effect
    this.createPlayerShootSound();
    this.createEnemyShootSound();
    this.createEnemyHitSound();
    this.createPlayerHitSound();
    this.createUFOFlyingSound();
    this.createUFOHitSound();
    this.createEnemyMoveSound();
    this.createGameOverSound();
    this.createLevelUpSound();
  }
  
  createOscillator(type, frequency, duration, volumeValue = 0.2, sweep = null) {
    return () => {
      if (this.muted) return;
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      if (sweep) {
        oscillator.frequency.exponentialRampToValueAtTime(
          sweep.frequency,
          this.audioContext.currentTime + sweep.timeConstant
        );
      }
      
      gainNode.gain.setValueAtTime(volumeValue, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration
      );
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration);
    };
  }
  
  createPlayerShootSound() {
    this.sounds.playerShoot = this.createOscillator('square', 880, 0.1, 0.1, {
      frequency: 440,
      timeConstant: 0.1
    });
  }
  
  createEnemyShootSound() {
    this.sounds.enemyShoot = this.createOscillator('sawtooth', 220, 0.2, 0.1, {
      frequency: 110,
      timeConstant: 0.2
    });
  }
  
  createEnemyHitSound() {
    this.sounds.enemyHit = this.createOscillator('square', 440, 0.1, 0.2);
  }
  
  createPlayerHitSound() {
    this.sounds.playerHit = this.createOscillator('square', 110, 0.3, 0.3, {
      frequency: 55,
      timeConstant: 0.3
    });
  }
  
  createUFOFlyingSound() {
    this.sounds.ufoFlying = () => {
      if (this.muted) return;
      
      // Create a more complex sound for UFO
      const oscillator1 = this.audioContext.createOscillator();
      const oscillator2 = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator1.type = 'sine';
      oscillator1.frequency.setValueAtTime(440, this.audioContext.currentTime);
      
      oscillator2.type = 'sine';
      oscillator2.frequency.setValueAtTime(443, this.audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator1.start();
      oscillator2.start();
      
      // Store the nodes to stop them later
      this.ufoSoundNodes = {
        oscillator1,
        oscillator2,
        gainNode
      };
      
      // Stop after 5 seconds (safety)
      setTimeout(() => {
        if (this.ufoSoundNodes) {
          this.ufoSoundNodes.oscillator1.stop();
          this.ufoSoundNodes.oscillator2.stop();
          this.ufoSoundNodes = null;
        }
      }, 5000);
    };
  }
  
  createUFOHitSound() {
    this.sounds.ufoHit = this.createOscillator('square', 880, 0.3, 0.3, {
      frequency: 110,
      timeConstant: 0.3
    });
  }
  
  createEnemyMoveSound() {
    // Create four different tones for the classic Space Invaders movement sound
    const tones = [
      this.createOscillator('square', 180, 0.1, 0.1),
      this.createOscillator('square', 160, 0.1, 0.1),
      this.createOscillator('square', 140, 0.1, 0.1),
      this.createOscillator('square', 120, 0.1, 0.1)
    ];
    
    let currentTone = 0;
    
    this.sounds.enemyMove = () => {
      tones[currentTone]();
      currentTone = (currentTone + 1) % tones.length;
    };
  }
  
  createGameOverSound() {
    this.sounds.gameOver = () => {
      if (this.muted) return;
      
      const duration = 2;
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        110,
        this.audioContext.currentTime + duration
      );
      
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration
      );
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration);
    };
  }
  
  createLevelUpSound() {
    this.sounds.levelUp = () => {
      if (this.muted) return;
      
      const duration = 0.6;
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.type = 'square';
      
      // Play ascending notes
      oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime + 0.4);
      
      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration
      );
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + duration);
    };
  }
  
  play(soundName) {
    // Resume audio context if it's suspended (browser policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    // Stop UFO sound if playing and not needed
    if (soundName === 'ufoHit' && this.ufoSoundNodes) {
      this.ufoSoundNodes.oscillator1.stop();
      this.ufoSoundNodes.oscillator2.stop();
      this.ufoSoundNodes = null;
    }
    
    // Play the requested sound
    if (this.sounds[soundName]) {
      this.sounds[soundName]();
    }
  }
  
  toggleMute() {
    this.muted = !this.muted;
    
    // Stop UFO sound if muted
    if (this.muted && this.ufoSoundNodes) {
      this.ufoSoundNodes.oscillator1.stop();
      this.ufoSoundNodes.oscillator2.stop();
      this.ufoSoundNodes = null;
    }
    
    return this.muted;
  }
}
