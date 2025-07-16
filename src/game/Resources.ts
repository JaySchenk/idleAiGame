export class ResourceManager {
  private static instance: ResourceManager
  private contentUnits: number = 0

  private constructor() {
    this.initializeResources()
  }

  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager()
    }
    return ResourceManager.instance
  }

  private initializeResources() {
    // Initialize Content Units with starting value of 0
    this.contentUnits = 0
  }

  // Get current Content Units
  public getContentUnits(): number {
    return this.contentUnits
  }

  // Add Content Units
  public addContentUnits(amount: number): void {
    this.contentUnits += amount
  }

  // Set Content Units (for loading saved games)
  public setContentUnits(amount: number): void {
    this.contentUnits = Math.max(0, amount)
  }

  // Spend Content Units (returns true if successful)
  public spendContentUnits(amount: number): boolean {
    if (this.contentUnits >= amount) {
      this.contentUnits -= amount
      return true
    }
    return false
  }

  // Check if player can afford amount
  public canAfford(amount: number): boolean {
    return this.contentUnits >= amount
  }

  // Format currency for display with advanced formatting
  public formatContentUnits(amount?: number): string {
    const value = amount !== undefined ? amount : this.contentUnits

    // Handle scientific notation for very large numbers
    if (value >= 1e18) {
      return value.toExponential(2) + ' HCU'
    }

    // Handle quadrillions
    if (value >= 1e15) {
      return (value / 1e15).toFixed(2) + 'Q HCU'
    }

    // Handle trillions
    if (value >= 1e12) {
      return (value / 1e12).toFixed(2) + 'T HCU'
    }

    // Handle billions
    if (value >= 1e9) {
      return (value / 1e9).toFixed(2) + 'B HCU'
    }

    // Handle millions
    if (value >= 1e6) {
      return (value / 1e6).toFixed(2) + 'M HCU'
    }

    // Handle thousands
    if (value >= 1e3) {
      return (value / 1e3).toFixed(2) + 'K HCU'
    }

    // Handle smaller numbers with 2 decimals
    return value.toFixed(2) + ' HCU'
  }

  // Reset content units for prestige
  public resetContentUnits(): void {
    this.contentUnits = 0
  }
}
