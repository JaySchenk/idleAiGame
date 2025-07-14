# Hollow Content Empire - Complete Implementation Plan

## Refactoring Assessment & Expansion Strategy

### Executive Summary
The current codebase requires significant refactoring to support the expansion systems. The main limitations are single-resource architecture, hardcoded generators, inflexible upgrades, and tightly coupled components. This plan addresses these issues systematically while implementing the expansion features.

## Phase 1: Critical Architecture Refactoring

### 1.1 Multi-Resource System Foundation
**Current Problem**: ResourceManager hardcoded to single "contentUnits"
**Solution**: Create abstract resource system supporting multiple resource types

**Implementation Details**:
- Create `ResourceType` interface with properties: id, name, displayName, isDepletable, initialValue, maxValue
- Implement `ResourceCollection` class managing Map<string, ResourceState>
- Add resource conversion chains and dependencies
- Create resource validation and formatting utilities

**Files to Refactor**:
- `/src/game/Resources.ts` - Complete rewrite
- `/src/components/ResourceDisplay.vue` - Make generic for multiple resources

**Configuration Structure**:
```typescript
interface ResourceConfig {
  id: string
  name: string
  displayName: string
  isDepletable: boolean
  initialValue: number
  maxValue?: number
  decayRate?: number
  visualIndicators: {
    healthy: string
    warning: string
    critical: string
  }
}
```

### 1.2 Configurable Generator Framework
**Current Problem**: Single hardcoded generator type
**Solution**: Create flexible generator system with resource consumption/production

**Implementation Details**:
- Create `GeneratorType` interface supporting multiple input/output resources
- Implement production chain calculations
- Add unlock conditions and progression gates
- Support for negative production (resource consumption)

**Files to Refactor**:
- `/src/game/Generators.ts` - Refactor for multi-generator types
- `/src/components/GeneratorPurchaseButton.vue` - Make generic and configurable

**Configuration Structure**:
```typescript
interface GeneratorConfig {
  id: string
  name: string
  category: string
  inputs: { resourceId: string; amount: number }[]
  outputs: { resourceId: string; amount: number }[]
  unlockConditions: UnlockCondition[]
  baseCost: { resourceId: string; amount: number }[]
  costGrowthRate: number
}
```

### 1.3 Effect-Based Upgrade System
**Current Problem**: Limited to simple multipliers
**Solution**: Create complex upgrade system with multiple effect types

**Implementation Details**:
- Create `UpgradeEffect` interface supporting: unlock, modify, condition, choice
- Implement upgrade trees with branching paths
- Add one-time milestone upgrades
- Support for negative trade-offs

**Files to Refactor**:
- `/src/game/Upgrades.ts` - Extend for complex effects
- `/src/components/UpgradeButton.vue` - Support dynamic upgrade types

**Configuration Structure**:
```typescript
interface UpgradeConfig {
  id: string
  name: string
  category: 'production' | 'unlock' | 'milestone' | 'choice'
  effects: UpgradeEffect[]
  costs: { resourceId: string; amount: number }[]
  requirements: RequirementCondition[]
  tradeoffs?: { resourceId: string; amount: number }[]
}
```

## Phase 2: Expansion System Implementation

### 2.1 Abstract Resource Implementation
**New Resources to Add**:
- Raw Data (input resource)
- Human Attention (conversion resource)
- Public Trust (depletable moral resource)
- Social Cohesion (stability resource)
- Environmental Stability (degradation resource)
- AI Autonomy (risk resource)

**Resource Dependencies**:
- Raw Data → Human Attention (via processing)
- Human Attention → Content Units (via optimization)
- Content Production → Public Trust depletion
- AI Autonomy → Potential system instability

### 2.2 Horizontal Progression: New Generator Types
**New Generators to Implement**:
1. **Hyper-personalized Ads AI**
   - Inputs: Raw Data, Human Attention
   - Outputs: Targeted Ads, Consumer Metrics
   - Depletes: Public Trust, Privacy

2. **Deepfake Entertainment AI**
   - Inputs: AI Cores, Processing Power
   - Outputs: Synthetic Media, Viral Narratives
   - Depletes: Reality Perception, Authenticity

3. **Political Propaganda AI**
   - Inputs: Raw Data, AI Cores
   - Outputs: Political Narratives, Disinformation
   - Depletes: Critical Thinking, Social Cohesion

4. **Automated Customer Service AI**
   - Inputs: Processing Power, Human Attention
   - Outputs: Automated Responses, Efficiency Reports
   - Depletes: Human Empathy, Job Satisfaction

5. **AI-Generated News Feeds**
   - Inputs: Raw Data, Public Attention
   - Outputs: Curated News, Filter Bubbles
   - Depletes: Information Diversity, Critical Thinking

### 2.3 Vertical Progression: Infrastructure Scaling
**New Infrastructure Systems**:
- Data Centers (processing power scaling)
- Server Farms (capacity scaling)
- Neural Network Clusters (AI capability scaling)
- Global CDN (distribution scaling)

**Scaling Mechanics**:
- Exponential cost curves with diminishing returns
- Infrastructure requirements for advanced generators
- Power consumption and environmental impact
- Maintenance costs and technical debt

### 2.4 Enhanced Cyclical Progression
**Multi-Layer Prestige System**:
1. **System Reboot** (current) - Basic reset with multipliers
2. **Reality Collapse** - Unlock new generator categories
3. **AI Singularity Event** - Unlock advanced AI systems
4. **Societal Reformat** - Unlock governance/control systems

**Meta-Currency: Dystopia Points**
- Earned based on societal damage caused
- Spent on permanent upgrades and starting bonuses
- Unlock new prestige scenarios and world states

## Phase 3: Interactive Systems

### 3.1 Decision & Consequence Framework
**New Manager: DecisionManager**
- Present moral dilemmas with resource trade-offs
- Track decision history and cumulative effects
- Implement branching narrative paths
- Create negative feedback loops

**Implementation Details**:
- Decision trees with multiple choice options
- Consequence tracking with delayed effects
- Visual indicators for world state changes
- Mitigation options with strategic costs

### 3.2 Dynamic World State System
**Enhanced NarrativeManager**:
- Link abstract resources to visual decay
- Dynamic background changes based on resource levels
- Escalating negative events and crises
- Corporate memo system for internal narrative

**Visual Integration**:
- Phaser 3 background responds to resource depletion
- UI color schemes reflect world state
- News ticker system for external events
- Achievement system for dystopian milestones

### 3.3 Expanded Narrative Content
**New Narrative Categories**:
- Corporate memos and internal communications
- News reports and public reactions
- Environmental degradation events
- Social unrest and resistance movements
- AI instability and malfunction events

**Branching Storylines**:
- Environmental collapse path
- Surveillance state path
- Social stratification path
- AI rebellion path

## Phase 4: Technical Implementation

### 4.1 Configuration System
**External Configuration Files**:
- `resources.json` - Resource definitions and relationships
- `generators.json` - Generator types and production chains
- `upgrades.json` - Upgrade effects and requirements
- `narrative.json` - Story events and decision trees
- `scenarios.json` - Prestige scenarios and world states

### 4.2 Manager Architecture Improvements
**New Managers**:
- `DecisionManager` - Handle player choices and consequences
- `WorldStateManager` - Track global state and degradation
- `ScenarioManager` - Handle prestige scenarios
- `ConversionManager` - Handle resource transformations

**Improved Managers**:
- `ResourceManager` - Multi-resource support
- `GeneratorManager` - Configurable generator types
- `UpgradeManager` - Complex effect system
- `NarrativeManager` - Decision integration

### 4.3 Component System Refactoring
**Generic Components**:
- `ResourceCard.vue` - Display any resource type
- `GeneratorCard.vue` - Display any generator type
- `UpgradeCard.vue` - Display any upgrade type
- `DecisionModal.vue` - Present choices and consequences
- `WorldStateIndicator.vue` - Show environmental/social state

### 4.4 Save System Enhancement
**Enhanced SaveManager**:
- Versioned save format for complex state
- Modular serialization for each manager
- Migration system for save format changes
- Backup and recovery mechanisms

## Phase 5: Balance & Polish

### 5.1 Progression Balancing
**Balance Considerations**:
- Resource production/consumption rates
- Generator unlock thresholds
- Upgrade cost curves
- Prestige timing and rewards
- Negative feedback loop intensity

### 5.2 Performance Optimization
**Performance Targets**:
- 60fps with all systems active
- Sub-100ms response times for UI interactions
- Efficient resource calculation algorithms
- Optimized save/load operations

## Implementation Order & Timeline

### Week 1-2: Foundation (Critical)
1. Multi-resource system architecture
2. Configurable generator framework
3. Configuration loading system
4. Basic UI component refactoring

### Week 3-4: Core Systems (High Priority)
1. New generator types implementation
2. Enhanced upgrade system
3. Decision framework
4. World state tracking

### Week 5-6: Advanced Features (Medium Priority)
1. Multi-layer prestige system
2. Dynamic narrative system
3. Visual integration improvements
4. Save system enhancements

### Week 7-8: Integration & Polish (Low Priority)
1. Balance testing and adjustment
2. Performance optimization
3. Bug fixing and edge cases
4. Documentation and final polish

## Success Metrics
- Support for 6+ resource types
- 5+ generator categories with unique mechanics
- 3+ prestige layers with meaningful progression
- 50+ narrative events with branching paths
- 20+ meaningful player decisions with consequences
- Smooth 60fps performance with all systems active

## Risk Mitigation
- **Technical Debt**: Refactor incrementally, maintain functionality
- **Performance**: Profile early, optimize critical paths
- **Complexity**: Implement systems gradually, test thoroughly
- **Balance**: Playtest frequently, adjust based on feedback

This plan ensures the current functionality is preserved while building the foundation for sophisticated expansion systems that support the dystopian narrative and provide hours of meaningful gameplay.

## Additional Implementation Details for Claude Code

### Code Style & Patterns
- **TypeScript**: Strict typing for all new interfaces and classes
- **Singleton Pattern**: Continue using for all managers with getInstance()
- **Configuration-Driven**: All new content loaded from external JSON files
- **Error Handling**: Wrap all critical operations in try-catch blocks
- **Testing**: Add unit tests for all new manager methods

### File Structure Additions
```
src/
├── game/
│   ├── managers/           # New organized manager directory
│   │   ├── DecisionManager.ts
│   │   ├── WorldStateManager.ts
│   │   ├── ScenarioManager.ts
│   │   └── ConversionManager.ts
│   ├── interfaces/         # Type definitions
│   │   ├── ResourceTypes.ts
│   │   ├── GeneratorTypes.ts
│   │   ├── UpgradeTypes.ts
│   │   └── DecisionTypes.ts
│   └── utils/             # Utility functions
│       ├── ResourceUtils.ts
│       ├── BalanceUtils.ts
│       └── ConfigLoader.ts
├── config/                # External configuration files
│   ├── resources.json
│   ├── generators.json
│   ├── upgrades.json
│   ├── narrative.json
│   └── scenarios.json
└── components/
    ├── shared/            # Generic reusable components
    │   ├── ResourceCard.vue
    │   ├── GeneratorCard.vue
    │   ├── UpgradeCard.vue
    │   └── DecisionModal.vue
    └── systems/           # System-specific components
        ├── WorldStateIndicator.vue
        ├── ResourceConversionPanel.vue
        └── PrestigeScenarioSelector.vue
```

### Key Interface Definitions
Provide complete TypeScript interfaces for all new systems to ensure type safety and consistency across the codebase.

### Migration Strategy
- Implement backward compatibility for existing saves
- Add feature flags for gradual rollout of new systems
- Create migration utilities for converting old save format

### Performance Considerations
- Use object pooling for frequently created/destroyed objects
- Implement efficient diff algorithms for UI updates
- Cache expensive calculations in managers
- Use Web Workers for heavy computations if needed

### Testing Strategy
- Unit tests for all manager methods
- Integration tests for cross-system interactions
- Performance benchmarks for critical paths
- Save/load validation tests

This comprehensive plan provides all the necessary details for implementing the expansion systems while maintaining code quality, performance, and the existing architecture patterns.