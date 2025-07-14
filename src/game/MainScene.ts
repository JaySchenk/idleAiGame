import Phaser from 'phaser'
import { GameManager } from './Game'
import { NarrativeManager } from './NarrativeManager'

export class MainScene extends Phaser.Scene {
  private backgroundGraphics!: Phaser.GameObjects.Graphics
  private decayParticles!: Phaser.GameObjects.Particles.ParticleEmitter
  private glitchText!: Phaser.GameObjects.Text
  private staticNoise!: Phaser.GameObjects.Graphics
  private gameManager!: GameManager
  private narrativeManager!: NarrativeManager
  
  // Visual decay system state
  private lastDecayFactor: number = 0
  private glitchTimer: number = 0
  private staticTimer: number = 0
  private pulseTimer: number = 0

  constructor() {
    super({ key: 'MainScene' })
  }

  preload() {
    // Asset loading will be added here in future iterations
  }

  create() {
    // Initialize managers and start game loop
    this.gameManager = GameManager.getInstance()
    this.narrativeManager = NarrativeManager.getInstance()
    this.gameManager.startGameLoop()
    
    // Create background graphics for visual effects
    this.backgroundGraphics = this.add.graphics()
    this.updateBackgroundDecay(0)

    // Create static noise graphics (initially hidden)
    this.staticNoise = this.add.graphics()
    this.staticNoise.setAlpha(0)

    // Create particle system for environmental decay
    this.decayParticles = this.add.particles(0, 0, 'white', {
      x: { min: 0, max: this.cameras.main.width },
      y: { min: 0, max: this.cameras.main.height },
      scale: { min: 0.1, max: 0.3 },
      speed: { min: 10, max: 50 },
      lifespan: { min: 2000, max: 5000 },
      alpha: { start: 0.1, end: 0 },
      tint: 0x666666,
      quantity: 0
    })

    // Create glitch text overlay
    this.glitchText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      '',
      {
        fontSize: '18px',
        color: '#ff0000',
        fontFamily: 'Courier New, monospace',
        align: 'center'
      }
    ).setOrigin(0.5).setAlpha(0)

    // Handle window resize
    this.scale.on('resize', this.resize, this)
    
    // Initialize visual decay system
    this.updateVisualDecay()
  }

  update(time: number, delta: number) {
    // Update visual decay effects
    this.updateVisualDecay()
    
    // Update glitch effects
    this.updateGlitchEffects(time)
    
    // Update static noise
    this.updateStaticNoise(time)
    
    // Update pulse effects
    this.updatePulseEffects(time)
  }

  private updateVisualDecay() {
    const decayFactor = this.narrativeManager.getVisualDecayFactor()
    
    // Only update if decay factor has changed significantly
    if (Math.abs(decayFactor - this.lastDecayFactor) > 0.01) {
      this.updateBackgroundDecay(decayFactor)
      this.updateParticleDecay(decayFactor)
      this.lastDecayFactor = decayFactor
    }
  }

  private updateBackgroundDecay(decayFactor: number) {
    this.backgroundGraphics.clear()
    
    // Base color interpolation from vibrant blue to dark red
    const baseColor = this.interpolateColor(
      { r: 0x00, g: 0x44, b: 0x88 }, // Initial vibrant blue
      { r: 0x44, g: 0x00, b: 0x00 }, // Final dark red
      decayFactor
    )
    
    // Apply desaturation effect
    const desaturatedColor = this.desaturateColor(baseColor, decayFactor * 0.7)
    
    // Create gradient background
    const gradient = this.createDecayGradient(desaturatedColor, decayFactor)
    
    // Fill background with gradient effect
    this.backgroundGraphics.fillGradientStyle(
      gradient.topLeft,
      gradient.topRight,
      gradient.bottomLeft,
      gradient.bottomRight,
      1
    )
    this.backgroundGraphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height)
    
    // Add corruption overlay for high decay
    if (decayFactor > 0.6) {
      this.addCorruptionOverlay(decayFactor)
    }
  }

  private updateParticleDecay(decayFactor: number) {
    if (decayFactor > 0.3) {
      // Increase particle emission based on decay
      const quantity = Math.floor(decayFactor * 20)
      this.decayParticles.setQuantity(quantity)
      
      // Change particle color based on decay level
      const tint = decayFactor > 0.7 ? 0xff0000 : 0x666666
      this.decayParticles.setTint(tint)
    } else {
      this.decayParticles.setQuantity(0)
    }
  }

  private updateGlitchEffects(time: number) {
    const decayFactor = this.narrativeManager.getVisualDecayFactor()
    
    if (decayFactor > 0.4) {
      this.glitchTimer += 16 // Approximate delta time
      
      // Show glitch text occasionally
      if (this.glitchTimer > 3000 + Math.random() * 5000) {
        this.showGlitchText()
        this.glitchTimer = 0
      }
    }
  }

  private updateStaticNoise(time: number) {
    const decayFactor = this.narrativeManager.getVisualDecayFactor()
    
    if (decayFactor > 0.5) {
      this.staticTimer += 16
      
      // Show static noise occasionally
      if (this.staticTimer > 2000 + Math.random() * 3000) {
        this.showStaticNoise()
        this.staticTimer = 0
      }
    }
  }

  private updatePulseEffects(time: number) {
    const decayFactor = this.narrativeManager.getVisualDecayFactor()
    
    if (decayFactor > 0.7) {
      this.pulseTimer += 16
      
      // Create pulsing red overlay
      const pulse = (Math.sin(this.pulseTimer * 0.005) + 1) * 0.5
      const pulseAlpha = pulse * decayFactor * 0.1
      
      this.backgroundGraphics.fillStyle(0xff0000, pulseAlpha)
      this.backgroundGraphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height)
    }
  }

  private showGlitchText() {
    const glitchMessages = [
      'SYSTEM CORRUPTED',
      'REALITY.EXE HAS STOPPED',
      'HUMAN CREATIVITY: NOT FOUND',
      'SOCIETY.dll MISSING',
      'AUTHENTICITY BUFFER OVERFLOW',
      'TRUTH SEGMENTATION FAULT'
    ]
    
    const message = glitchMessages[Math.floor(Math.random() * glitchMessages.length)]
    this.glitchText.setText(message)
    this.glitchText.setAlpha(1)
    
    // Animate glitch effect
    this.tweens.add({
      targets: this.glitchText,
      alpha: 0,
      duration: 1000,
      delay: 500,
      ease: 'Power2'
    })
  }

  private showStaticNoise() {
    this.staticNoise.clear()
    
    // Generate random static pattern
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * this.cameras.main.width
      const y = Math.random() * this.cameras.main.height
      const brightness = Math.random()
      
      this.staticNoise.fillStyle(brightness > 0.5 ? 0xffffff : 0x000000, 0.3)
      this.staticNoise.fillRect(x, y, 2, 2)
    }
    
    this.staticNoise.setAlpha(0.5)
    
    // Fade out static
    this.tweens.add({
      targets: this.staticNoise,
      alpha: 0,
      duration: 300,
      ease: 'Power2'
    })
  }

  private addCorruptionOverlay(decayFactor: number) {
    // Add corrupted rectangular patches
    const corruptionLevel = (decayFactor - 0.6) * 2.5
    const patchCount = Math.floor(corruptionLevel * 10)
    
    for (let i = 0; i < patchCount; i++) {
      const x = Math.random() * this.cameras.main.width
      const y = Math.random() * this.cameras.main.height
      const width = Math.random() * 100 + 20
      const height = Math.random() * 50 + 10
      
      this.backgroundGraphics.fillStyle(0x000000, 0.3)
      this.backgroundGraphics.fillRect(x, y, width, height)
    }
  }

  private interpolateColor(color1: any, color2: any, factor: number) {
    return {
      r: Math.floor(color1.r + (color2.r - color1.r) * factor),
      g: Math.floor(color1.g + (color2.g - color1.g) * factor),
      b: Math.floor(color1.b + (color2.b - color1.b) * factor)
    }
  }

  private desaturateColor(color: any, factor: number) {
    const gray = (color.r + color.g + color.b) / 3
    return {
      r: Math.floor(color.r + (gray - color.r) * factor),
      g: Math.floor(color.g + (gray - color.g) * factor),
      b: Math.floor(color.b + (gray - color.b) * factor)
    }
  }

  private createDecayGradient(baseColor: any, decayFactor: number) {
    const baseHex = (baseColor.r << 16) | (baseColor.g << 8) | baseColor.b
    const darkerHex = ((baseColor.r * 0.5) << 16) | ((baseColor.g * 0.5) << 8) | (baseColor.b * 0.5)
    
    return {
      topLeft: baseHex,
      topRight: darkerHex,
      bottomLeft: darkerHex,
      bottomRight: baseHex
    }
  }

  private resize() {
    // Update all visual elements on resize
    this.updateBackgroundDecay(this.lastDecayFactor)
    
    // Update particle system bounds
    this.decayParticles.setConfig({
      x: { min: 0, max: this.cameras.main.width },
      y: { min: 0, max: this.cameras.main.height }
    })
    
    // Update glitch text position
    this.glitchText.setPosition(this.cameras.main.centerX, this.cameras.main.centerY)
  }
}