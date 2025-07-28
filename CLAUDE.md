# Hollow Content Empire - Dystopian Idle Game

## Project Overview

A dystopian idle game built with Vue 3 + TypeScript. Players generate "Hollow Content Units" through manual clicks and automated generators while following a narrative about AI systems being co-opted by corporate interests.

## Tech Stack

- **Frontend**: Vue 3 (Composition API) + TypeScript
- **Build Tool**: Vite with code splitting
- **State Management**: Custom singleton pattern
- **Styling**: Custom CSS with dark dystopian theme
- **Testing**: Vitest + Vue Test Utils

## Architecture

**Single-Layer Design**:

- **UI Layer**: Vue 3 components with custom CSS styling

## Development Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run test:unit    # Run unit tests
npm run lint         # ESLint code quality checks
npm run format       # Prettier code formatting
```

## Key Directories

- `src/game/` - Core game logic (TypeScript singletons)
- `src/components/` - Vue 3 UI components  
- `src/assets/` - Styles and static content
- `config/` - Game configuration JSON files

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
- **Narrative**: 13 milestone-based story events
- **Save System**: Auto-save every 30 seconds + manual save button
- **State Management**: Hybrid approach - store essential state, calculate derived values with formulas
- **Configuration**: Game configuration loaded from JSON files in `/config/` directory (generators, narratives, upgrades)

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
- **Theme**: Dystopian terminology throughout ("Hollow", "Mindless", "Soul-Crushing")
- **Save Data Pattern**: Following idle game best practices - store base values (current HCU, lifetime HCU, generator counts, upgrade flags), calculate derived values (costs, production rates) using mathematical formulas to keep save files efficient

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
