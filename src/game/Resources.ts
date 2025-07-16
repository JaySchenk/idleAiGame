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
  
  // Format currency for display
  public formatContentUnits(amount?: number): string {
    const value = amount !== undefined ? amount : this.contentUnits
    return `${Math.floor(value)} HCU`
  }
  
  // Reset content units for prestige
  public resetContentUnits(): void {
    this.contentUnits = 0
  }
}