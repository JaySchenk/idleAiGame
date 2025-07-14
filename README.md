# Hollow Content Empire

A dystopian idle game exploring AI-driven content generation and its societal consequences.

## 🎮 Game Overview

Play as the CTO of OmniCorp, wielding powerful AI to generate "Hollow Content Units" while witnessing society's gradual collapse. Experience the dark side of algorithmic content through automated generators, corporate upgrades, and narrative-driven prestige mechanics.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 to play.

## 📱 How to Play

1. **Click** to manually generate content
2. **Purchase** Mindless Ad-Bot Farms for automation
3. **Upgrade** to Soul-Crushing Automation for efficiency
4. **Prestige** through Societal Collapse Reset for global multipliers
5. **Watch** society decay through 13 narrative milestones

## 🎯 Key Features

- **Dual-Layer Architecture**: Vue 3 UI over Phaser 3 visual effects
- **Dynamic Storytelling**: Narrative events triggered by progression milestones
- **Visual Decay System**: Background degrades as societal stability decreases
- **Persistent Progress**: Auto-save every 30 seconds with manual save option
- **Dystopian Theming**: Dark terminology reinforces the game's themes

## 🏗️ Tech Stack

- **Frontend**: Vue 3 + TypeScript
- **Game Engine**: Phaser 3 (visual effects)
- **Build Tool**: Vite
- **State Management**: Custom singleton pattern
- **Styling**: Custom CSS with dark theme

## 🛠️ Development

```bash
npm run dev          # Development server
npm run build        # Production build
npm run test:unit    # Run tests
npm run lint         # Code quality checks
npm run format       # Format code
```

## 📊 Game Progression

The complete progression system is defined in `progression-system.json`:

- **1 Generator Type**: Exponential cost scaling (base: 10, growth: 1.15x)
- **1 Upgrade**: +25% production multiplier
- **13 Story Events**: From AI awakening to societal collapse
- **Prestige System**: Global multipliers starting at 1.25x per level

## 🎨 Visual System

- **Background Color**: Transitions from blue → gray → red based on societal stability
- **Particle Effects**: Intensity increases as society decays
- **Glitch Overlay**: Dystopian error messages during critical moments
- **Responsive Design**: Works on desktop and mobile

## 💾 Save System

- **Auto-Save**: Every 30 seconds
- **Manual Save**: Instant save button with visual feedback
- **Data Persistence**: Complete game state including narrative progress
- **Error Recovery**: Graceful handling of corrupted save data

## 🎭 Narrative Themes

Experience the dark transformation of AI systems:
- **Corporate Co-option**: Marketing departments take control
- **Mass Automation**: Human creativity becomes obsolete
- **Political Manipulation**: Democracy operates on algorithms
- **Cultural Collapse**: Art becomes a corporate product
- **Societal Dependency**: Humanity forgets how to create

## 🔧 Architecture

**Dual-Layer Design**:
- **Canvas Layer**: Phaser 3 background with dynamic visual decay
- **UI Layer**: Vue 3 interactive components overlay

**Core Systems**:
- `GameManager`: Central coordinator singleton
- `ResourceManager`: Currency system
- `GeneratorManager`: Automation mechanics
- `UpgradeManager`: Progression system
- `NarrativeManager`: Story progression
- `SaveManager`: Persistence layer

## 📈 Current Status

**✅ Completed**:
- Core game loop with 100ms tick rate
- Complete UI with visual feedback
- Progression system with upgrades and prestige
- Save/load functionality
- Narrative integration with visual effects

**⏳ Upcoming**:
- Error handling and edge cases
- Performance optimization
- Comprehensive testing
- Deployment configuration

## 🤝 Contributing

The progression system is designed to be extensible. See `progression-system.json` for the complete game definition, including:
- Generator specifications
- Upgrade requirements and effects
- Narrative event triggers
- Balance parameters
- Visual system integration

## 📄 License

This is an educational project exploring the intersection of technology and society through interactive storytelling.

---

*"You created this AI to 'elevate humanity'... but something feels wrong."*