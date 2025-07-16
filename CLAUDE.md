# Hollow Content Empire - Dystopian Idle Game

## Project Overview
A dystopian idle game built with Vue 3 + Phaser 3 dual-layer architecture. Players generate "Hollow Content Units" through manual clicks and automated generators while following a narrative about AI systems being co-opted by corporate interests.

## Tech Stack
- **Frontend**: Vue 3 (Composition API) + TypeScript
- **Game Engine**: Phaser 3 (visual effects, background canvas)
- **Build Tool**: Vite with code splitting
- **State Management**: Custom singleton pattern (not Pinia)
- **Styling**: Custom CSS with dark dystopian theme
- **Testing**: Vitest + Vue Test Utils

## Architecture
**Dual-Layer Design**:
- **Canvas Layer** (z-index: 1): Phaser 3 background with dynamic visual decay
- **UI Layer** (z-index: 2): Vue 3 interactive components overlay

## Development Commands
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run test:unit    # Run unit tests
npm run lint         # ESLint code quality checks
npm run format       # Prettier code formatting
```

## Project Structure
```
src/
├── game/                    # Core game logic (TypeScript singletons)
│   ├── Game.ts             # GameManager - central coordinator
│   ├── Resources.ts        # ResourceManager - currency system
│   ├── Generators.ts       # GeneratorManager - automation
│   ├── Upgrades.ts         # UpgradeManager - progression
│   ├── SaveManager.ts      # Save/load with localStorage
│   ├── NarrativeManager.ts # Story progression system
│   └── MainScene.ts        # Phaser scene with visual effects
├── components/             # Vue 3 UI components
│   ├── ResourceDisplay.vue
│   ├── GeneratorPurchaseButton.vue
│   ├── ManualClickerButton.vue
│   ├── ProgressBar.vue
│   ├── UpgradeButton.vue
│   ├── PrestigeButton.vue
│   ├── SaveGameButton.vue
│   └── NarrativeDisplay.vue
├── assets/
│   ├── style.css          # Dark dystopian theme
│   └── narratives.ts      # Story content
├── App.vue                # Main layout
└── progression-system.json # Complete progression system definition
```

## Code Conventions
- **TypeScript**: Required for all game logic
- **Singleton Pattern**: All managers (GameManager, ResourceManager, etc.)
- **Vue 3 Composition API**: Use `<script setup>` syntax
- **Import Style**: Use ES modules with destructuring
- **Component Communication**: Access game state via `GameManager.getInstance()`
- **Styling**: Custom CSS classes, no external UI libraries
- **Error Handling**: Wrap critical operations in try-catch blocks

## Game Systems
- **Currency**: "Hollow Content Units" (HCU) - primary resource
- **Generators**: "Mindless Ad-Bot Farm" - exponential costs (base: 10, growth: 1.15x)
- **Upgrades**: "Soul-Crushing Automation" - production multipliers
- **Prestige**: "Societal Collapse Reset" - global multipliers (1.25x per level)
- **Narrative**: 13 milestone-based story events with visual decay
- **Save System**: Auto-save every 30 seconds + manual save button
- **Progression Data**: See `progression-system.json` for complete system definition

## Current Implementation Status
**✅ Completed**:
- A-F: Foundation, Core Loop, UI, Progression, Save System, Narrative
- All major game mechanics functional
- Comprehensive visual feedback and animations

**⏳ Pending**:
- G: Error Handling & Edge Cases
- H: Performance Optimization
- I: Testing Framework
- J: Deployment Configuration

## Important Notes
- **Custom Implementation**: Uses custom singleton pattern for game state management
- **Game Loop**: 100ms tick rate with delta time calculations
- **Visual Effects**: Background decay tied to narrative progression
- **Theme**: Dystopian terminology throughout ("Hollow", "Mindless", "Soul-Crushing")
- **Performance**: 60fps target with hardware-accelerated animations

## Next Steps
1. Implement comprehensive error handling and input validation
2. Add performance monitoring and optimization
3. Set up Jest testing framework
4. Configure production deployment

## Workflow
- Use `GameManager.getInstance()` to access game state
- Test in browser after significant changes
- Run lint/format before committing
- Check console for any errors during development