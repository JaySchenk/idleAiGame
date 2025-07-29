# Hollow Content Empire - Dystopian Idle Game

## Project Overview

A dystopian idle game built with Vue 3 + TypeScript. Players generate "Hollow Content Units" through manual clicks and automated generators while following a narrative about AI systems being co-opted by corporate interests.

## Tech Stack

- **Frontend**: Vue 3 (Composition API) + TypeScript
- **Build Tool**: Vite with code splitting
- **State Management**: Pinia store with reactive state management
- **Styling**: Custom CSS with dark dystopian theme
- **Testing**: Vitest + Vue Test Utils

## Architecture

**Modern Vue 3 Architecture**:

- **UI Layer**: Vue 3 components with Composition API
- **State Management**: Pinia store with reactive state
- **Styling**: Custom CSS with dark dystopian theme

## Development Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm test             # Run unit tests
npm run lint         # ESLint code quality checks
npm run format       # Prettier code formatting
```

## Key Directories

- `src/stores/` - Pinia store for centralized state management
- `src/components/` - Vue 3 UI components with Composition API
- `src/game/` - Core game utilities
- `src/assets/` - Styles and static content
- `src/config/` - Game configuration TypeScript files

## Code Conventions

- **TypeScript**: Required for all game logic
- **Pinia Store**: Centralized state management with `useGameStore()`
- **Vue 3 Composition API**: Use `<script setup>` syntax
- **Import Style**: Use ES modules with destructuring
- **Component Communication**: Access game state via `useGameStore()` composable
- **Styling**: Custom CSS classes, no external UI libraries
- **Error Handling**: Wrap critical operations in try-catch blocks

## Game Systems

- **Currency**: "Hollow Content Units" (HCU) - primary resource
- **Generators**: "Mindless Ad-Bot Farm" - exponential costs (base: 10, growth: 1.15x)
- **Upgrades**: "Soul-Crushing Automation" - production multipliers
- **Prestige**: "Societal Collapse Reset" - global multipliers (1.25x per level)
- **Narrative**: 13 milestone-based story events
- **Save System**: Auto-save every 5 seconds + manual save button
- **State Management**: Pinia store with reactive computed properties and centralized actions
- **Configuration**: Game configuration defined in TypeScript files in `/src/config/` directory (generators, narratives, upgrades)

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

- **Modern Architecture**: Uses Pinia store for reactive state management
- **Game Loop**: 100ms tick rate with reactive computed properties
- **Theme**: Dystopian terminology throughout ("Hollow", "Mindless", "Soul-Crushing")
- **Save Data Pattern**: Following idle game best practices - store base values (current HCU, lifetime HCU, generator counts, upgrade flags), calculate derived values (costs, production rates) using mathematical formulas to keep save files efficient

## Next Steps

1. Implement comprehensive error handling and input validation
2. Add performance monitoring and optimization
3. Set up Jest testing framework
4. Configure production deployment

## Workflow

- Use `useGameStore()` composable to access game state
- Test in browser after significant changes
- Run lint/format before committing
- Check console for any errors during development
