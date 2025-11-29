# MCP Orchestration Architecture

## Overview

This document defines the communication protocol and role boundaries for the hierarchical MCP server system that manages the chevp workspace ecosystem.

---

## Communication Protocol Specification

### 1. Message Types

```typescript
// packages/core/src/protocol/types.ts

export type MCPRole =
  // Executive Layer
  | 'ceo' | 'cto' | 'cpo' | 'cfo' | 'cmo' | 'coo'
  // Product Layer
  | 'coregfx-po' | 'cryo-po' | 'nuna-po' | 'arctic-po'
  // Business Analyst Layer
  | 'coregfx-ba' | 'cryo-ba' | 'nuna-ba' | 'arctic-ba'
  // Architect Layer
  | 'coregfx-architect' | 'cryo-architect' | 'nuna-architect'
  | 'arctic-architect' | 'infra-architect';

export type MessageType =
  | 'request'      // Ask another MCP to do something
  | 'response'     // Reply to a request
  | 'notification' // Fire-and-forget info
  | 'escalation'   // Problem that needs higher authority
  | 'directive'    // Top-down instruction
  | 'report';      // Bottom-up status update

export type Priority = 'low' | 'normal' | 'high' | 'critical';

export interface MCPMessage {
  id: string;                    // UUID
  type: MessageType;
  from: MCPRole;
  to: MCPRole;
  priority: Priority;
  timestamp: string;             // ISO 8601
  correlationId?: string;        // Links related messages
  replyTo?: string;              // Message ID being replied to
  payload: MessagePayload;
  context?: SharedContext;
  requiresResponse: boolean;
  deadline?: string;             // ISO 8601
}

export interface MessagePayload {
  action: string;
  parameters: Record<string, unknown>;
  reason?: string;
}

export interface EscalationPayload extends MessagePayload {
  action: 'escalate';
  parameters: {
    originalRequest: MCPMessage;
    blocker: string;
    attemptedResolution: string;
    options: EscalationOption[];
  };
}

export interface EscalationOption {
  id: string;
  description: string;
  impact: string;
  recommendation: boolean;
}

export interface SharedContext {
  repositories?: string[];
  products?: string[];
  sprint?: string;
  milestone?: string;
  relatedMessages?: string[];
}
```

### 2. Communication Patterns

#### Pattern A: Direct Tool Call (Synchronous)
Used for immediate operations that don't require deliberation.

```typescript
// CEO asks CTO for architecture audit
const response = await ctoMcp.call('audit_architecture', {
  scope: 'coregfx',
  depth: 'shallow'
});
```

#### Pattern B: Message Queue (Asynchronous)
Used for strategic decisions, cross-team coordination, and approvals.

```typescript
// Message stored in shared context store
await messageQueue.send({
  id: uuid(),
  type: 'request',
  from: 'coregfx-po',
  to: 'cpo',
  priority: 'normal',
  payload: {
    action: 'approve_release',
    parameters: {
      version: '2.0.0',
      changelog: '...',
      riskAssessment: '...'
    },
    reason: 'Q1 milestone delivery'
  },
  requiresResponse: true,
  deadline: '2025-01-15T00:00:00Z'
});
```

#### Pattern C: Broadcast (Notification)
Used for announcements that affect multiple MCPs.

```typescript
// CTO announces breaking change
await messageQueue.broadcast({
  type: 'notification',
  from: 'cto',
  to: ['coregfx-architect', 'nuna-architect', 'cryo-architect'],
  payload: {
    action: 'breaking_change_announced',
    parameters: {
      component: 'shader-api',
      version: '3.0.0',
      migrationGuide: 'https://...',
      deadline: '2025-02-01'
    }
  },
  requiresResponse: false
});
```

### 3. Escalation Protocol

```
Level 1: Peer Resolution
    Architect ↔ Architect (technical disagreement)
    PO ↔ PO (priority conflict)

Level 2: Manager Resolution
    → CTO (technical escalation)
    → CPO (product escalation)

Level 3: Executive Resolution
    → CEO (cross-domain, strategic)
```

---

## Role Definitions

### Executive Layer

#### CEO-MCP
```yaml
name: ceo-mcp
responsibility: Strategic direction and cross-cutting decisions
scope: All 200+ repositories, all products

tools:
  # Portfolio Management
  - name: get_portfolio_overview
    description: High-level status of all products
    returns: ProductStatus[]

  - name: set_strategic_priority
    description: Define quarterly focus areas
    params:
      quarter: string
      priorities: Priority[]

  - name: allocate_resources
    description: Assign repos/teams to products
    params:
      assignments: ResourceAssignment[]

  # Decision Making
  - name: approve_major_change
    description: Gate for breaking changes
    params:
      changeId: string
      decision: 'approve' | 'reject' | 'defer'
      conditions?: string[]

  - name: resolve_escalation
    description: Handle escalated conflicts
    params:
      escalationId: string
      resolution: Resolution

  # Coordination
  - name: request_executive_summary
    description: Ask subordinate MCPs for status
    params:
      from: MCPRole[]
      topics: string[]

delegates_to: [cto, cpo, cfo, cmo, coo]
escalation_from: [cto, cpo]
```

#### CTO-MCP
```yaml
name: cto-mcp
responsibility: Technical excellence across all products
scope: Architecture, quality standards, technical debt

tools:
  # Architecture
  - name: audit_architecture
    description: Check consistency across repos
    params:
      scope: string | string[]
      depth: 'shallow' | 'deep'
    returns: ArchitectureAuditReport

  - name: enforce_standards
    description: Apply coding standards to repos
    params:
      repos: string[]
      standards: StandardId[]
      mode: 'check' | 'fix'

  - name: evaluate_technology
    description: Assess new tech for adoption
    params:
      technology: string
      useCase: string
    returns: TechnologyAssessment

  # Debt Management
  - name: manage_technical_debt
    description: Track and prioritize debt
    params:
      action: 'list' | 'add' | 'prioritize' | 'resolve'
      debtItem?: TechnicalDebtItem

  # Coordination
  - name: coordinate_architects
    description: Sync product architects
    params:
      topic: string
      architects: MCPRole[]

  - name: review_breaking_changes
    description: Approve API changes
    params:
      changeRequest: BreakingChangeRequest
    returns: BreakingChangeDecision

delegates_to: [coregfx-architect, cryo-architect, nuna-architect, arctic-architect, infra-architect]
reports_to: ceo
```

#### CPO-MCP
```yaml
name: cpo-mcp
responsibility: Product strategy and feature coordination
scope: All product backlogs, cross-product features

tools:
  - name: get_all_backlogs
    description: Aggregate product backlogs
    returns: BacklogSummary[]

  - name: coordinate_release
    description: Sync multi-product releases
    params:
      products: string[]
      targetDate: string

  - name: resolve_priority_conflict
    description: When POs disagree on shared work
    params:
      conflict: PriorityConflict
    returns: Resolution

  - name: track_cross_product_epic
    description: Features spanning products
    params:
      epic: CrossProductEpic

delegates_to: [coregfx-po, cryo-po, nuna-po, arctic-po]
reports_to: ceo
```

### Product Layer

#### Product Owner MCPs (Template)
```yaml
# Applies to: coregfx-po, cryo-po, nuna-po, arctic-po
name: {product}-po-mcp
responsibility: Product direction and backlog management
scope: {product} repositories

tools:
  # Backlog Management
  - name: manage_backlog
    description: CRUD for user stories
    params:
      action: 'list' | 'add' | 'update' | 'delete' | 'prioritize'
      story?: UserStory

  - name: plan_sprint
    description: Sprint composition
    params:
      sprintId: string
      stories: string[]
      capacity: number

  - name: accept_feature
    description: Mark story as done
    params:
      storyId: string
      acceptanceCriteria: AcceptanceResult[]

  # Coordination
  - name: request_estimate
    description: Ask architect for sizing
    params:
      storyIds: string[]
    returns: Estimate[]

  - name: report_to_cpo
    description: Status updates
    returns: ProductStatusReport

delegates_to: [{product}-ba]
reports_to: cpo
collaborates_with: [{product}-architect, cto]
```

#### Business Analyst MCPs (Template)
```yaml
# Applies to: coregfx-ba, cryo-ba, nuna-ba, arctic-ba
name: {product}-ba-mcp
responsibility: Requirements analysis and specification
scope: {product} user stories and acceptance criteria

tools:
  - name: write_user_story
    description: Create detailed stories
    params:
      title: string
      asA: string
      iWant: string
      soThat: string

  - name: define_acceptance_criteria
    description: Testable criteria
    params:
      storyId: string
      criteria: AcceptanceCriterion[]

  - name: analyze_requirements
    description: Break down features
    params:
      featureDescription: string
    returns: RequirementAnalysis

  - name: identify_dependencies
    description: Cross-feature deps
    params:
      storyIds: string[]
    returns: DependencyGraph

  - name: validate_completeness
    description: Check story quality
    params:
      storyId: string
    returns: CompletenessReport

reports_to: {product}-po
collaborates_with: [{product}-architect, {product}-po]
```

### Architect Layer

#### Product Architect MCPs (Template)
```yaml
# Applies to: coregfx-architect, cryo-architect, nuna-architect, arctic-architect
name: {product}-architect-mcp
responsibility: Technical design and quality for {product}
scope: Architecture, patterns, code quality within {product}

tools:
  # Design
  - name: design_module
    description: Create architecture for feature
    params:
      feature: string
      constraints: string[]
    returns: ModuleDesign

  - name: propose_refactoring
    description: Suggest improvements
    params:
      scope: string
      goal: string
    returns: RefactoringProposal

  - name: document_architecture
    description: ADRs, diagrams
    params:
      type: 'adr' | 'diagram' | 'overview'
      content: ArchitectureDocument

  # Quality
  - name: review_code_quality
    description: Audit implementation
    params:
      repos: string[]
      checks: QualityCheck[]
    returns: QualityReport

  - name: enforce_patterns
    description: Check pattern compliance
    params:
      repos: string[]
      patterns: PatternId[]

  # Estimation
  - name: estimate_effort
    description: Technical sizing
    params:
      stories: string[]
    returns: EffortEstimate[]

  # Analysis
  - name: analyze_dependencies
    description: Repo dependency graph
    params:
      repos: string[]
    returns: DependencyGraph

reports_to: cto
collaborates_with: [{product}-po, {product}-ba, peer architects]
```

#### Infra-Architect-MCP (Special Role)
```yaml
name: infra-architect-mcp
responsibility: Shared infrastructure, tooling, AND MCP orchestration
scope: Build systems, CI/CD, shared libraries, MCP coordination

tools:
  # Infrastructure
  - name: manage_build_system
    description: CMake, build configs
    params:
      action: 'audit' | 'update' | 'fix'
      scope: string[]

  - name: update_ci_templates
    description: Shared CI patterns
    params:
      template: CITemplate
      repos: string[]

  - name: manage_shared_libs
    description: Common utilities
    params:
      action: 'list' | 'add' | 'update' | 'deprecate'
      library?: SharedLibrary

  # MCP Orchestration (unique to infra-architect)
  - name: route_message
    description: Route messages between MCPs
    params:
      message: MCPMessage

  - name: get_mcp_status
    description: Health check all MCPs
    returns: MCPHealthReport[]

  - name: invoke_mcp
    description: Call another MCP's tool
    params:
      target: MCPRole
      tool: string
      params: Record<string, unknown>

  - name: broadcast_message
    description: Send to multiple MCPs
    params:
      message: MCPMessage
      recipients: MCPRole[]

reports_to: cto
```

---

## Repository Ownership Map

### Product Ecosystems

#### CoreGFX Product
```yaml
owner: coregfx-po
architect: coregfx-architect
analyst: coregfx-ba

repositories:
  # Core Graphics
  - playground/arctic-cpp-playground  # Contains coregfx development
  - tools/coregfx-sdk-dev

  # Related (graphics-focused)
  - misc/render-forge
  - misc/vkpbr5
  - misc/vulkan-grpc-renderer
  - playground/vulkan-playground
  - misc/texturekit
  - misc/webgl-component
```

#### Cryo Product
```yaml
owner: cryo-po
architect: cryo-architect
analyst: cryo-ba

repositories:
  # Core Cryo
  - cryo/cryo
  - cryo/cryo-asset
  - cryo/cryo-build-lab-tools
  - cryo/cryo-cache
  - cryo/cryo-container
  - cryo/cryo-engine-interface
  - cryo/cryo-engine-specification
  - cryo/cryo-game-sdk
  - cryo/cryo-pipeline
  - cryo/cryo-protocol
  - cryo/cryo-quickstarts
  - cryo/cryo-shader-cli
  - cryo/cryo-tooling
  - cryo/cryo-web-assets
  - cryo/cryojs

  # Content Libraries
  - cryo/cryo-content-library-buildings
  - cryo/cryo-content-library-prime
  - cryo/cryo-content-library-stylized-nature
  - cryo/cryo-content-library-ui
```

#### Nuna Product
```yaml
owner: nuna-po
architect: nuna-architect
analyst: nuna-ba

repositories:
  - nuna/nuna-backend-core
  - nuna/nuna-backend-plugins
  - nuna/nuna-docs
  - nuna/nuna-mcp
  - nuna/nuna-playground-cpp
  - nuna/nuna-sdk-cpp
  - nuna/nuna-web-platform
  - nuna/nuna-workspace
```

#### Arctic Product
```yaml
owner: arctic-po
architect: arctic-architect
analyst: arctic-ba

repositories:
  # Core Arctic
  - arctic/arctic-bundle-service
  - arctic/arctic-container-registry
  - arctic/arctic-content-bundle-system
  - arctic/arctic-game-client
  - arctic/arctic-game-snowball
  - arctic/arctic-php-services
  - arctic/arctic-protocol
  - arctic/arctic-services
  - arctic/arctic-workspace

  # UX & Content
  - arctic/arctic-stylized-nature
  - arctic/arctic-tutorial-furniture
  - arctic/arctic-ux-prototypes

  # Engine
  - repos/arctic-engine
```

### Supporting Ecosystems (CTO Oversight)

#### Nexus Platform
```yaml
oversight: cto
architect: infra-architect

repositories:
  - nexus/nexus-control
  - nexus/nexus-data
  - nexus/nexus-editor-frame
  - nexus/nexus-frame
  - nexus/nexus-json-server
  - nexus/nexus-map-frame
```

#### Axon Runtime
```yaml
oversight: cto
architect: infra-architect

repositories:
  - axon/axon-node
  - axon/axon-node-site
  - axon/axon-registration-service
  - axon/axon-resource-registry
  - axon/axon-runtime
```

#### Quantum Rift
```yaml
oversight: cto
architect: infra-architect

repositories:
  - quantum-rift/quantum-rift-csharp-mongodb
  - quantum-rift/quantum-rift-electron-client
  - quantum-rift/quantum-rift-sample-csharp-backend-project
  - quantum-rift/quantum-rift-sample-quarkus-backend-project
  - quantum-rift/quantum-rift-scene-converter
```

### Infrastructure (Infra-Architect)

```yaml
owner: infra-architect
oversight: cto

repositories:
  # MCP Suite
  - tools/chevp-mcp-suite

  # CLI Tools
  - tools/che-cli
  - tools/quon-cli

  # SDK Development
  - tools/che-sdk-dev
  - tools/nebulon-sdk-dev
  - tools/silvarin-sdk-dev
```

### Applications (CMO/COO)

```yaml
oversight: coo
documentation: cmo

repositories:
  - apps/atlas-studio
  - apps/biomedical
  - apps/ecs-configurator
  - apps/ice-box
  - apps/interior-lab
  - apps/kitty-on-screen
  - apps/penguin-on-screen
  - apps/scene-3d
  - apps/territory-3d
```

### Websites (CMO)

```yaml
owner: cmo

repositories:
  - sites/antarctica.io
  - sites/atelier-art-gold.io
  - sites/chevp.github.io
  - sites/chevp-desktop
  - sites/ecs-configurator-site
  - sites/public-playground-site
```

### Frameworks (CTO)

```yaml
oversight: cto
architect: infra-architect

repositories:
  - frameworks/coreflux
  - frameworks/coreflux-hub
  - frameworks/fire
  - frameworks/fire-mesh
  - frameworks/kalyra-dev
  - frameworks/nimbus
  - frameworks/nyx-broker
  - frameworks/orion-framework
```

### Misc (Triage Required)

```yaml
oversight: cto
status: needs_categorization

repositories:
  # 50+ repositories need assignment
  - misc/*
```

---

## Shared Context Store

### Directory Structure

```
chevp-mcp-suite/
├── context-store/
│   ├── portfolio/
│   │   ├── roadmap.json          # Company-wide roadmap
│   │   ├── priorities.json       # Current strategic priorities
│   │   └── products.json         # Product registry
│   │
│   ├── technical/
│   │   ├── standards.json        # Coding standards
│   │   ├── architecture-decisions/
│   │   │   ├── adr-001-*.md
│   │   │   └── ...
│   │   ├── debt-registry.json    # Technical debt tracking
│   │   └── technology-radar.json # Tech adoption status
│   │
│   ├── products/
│   │   ├── coregfx/
│   │   │   ├── backlog.json
│   │   │   ├── architecture.json
│   │   │   ├── dependencies.json
│   │   │   └── sprints/
│   │   ├── cryo/
│   │   │   └── ...
│   │   ├── nuna/
│   │   │   └── ...
│   │   └── arctic/
│   │       └── ...
│   │
│   ├── messages/
│   │   ├── pending/              # Unprocessed messages
│   │   ├── processed/            # Archived messages
│   │   └── escalations/          # Active escalations
│   │
│   └── repo-registry/
│       ├── ownership.json        # Repo → Owner mapping
│       ├── categories.json       # Repo categorization
│       └── health.json           # Repo health metrics
```

### Schema: ownership.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "version": { "type": "string" },
    "lastUpdated": { "type": "string", "format": "date-time" },
    "repositories": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "owner": { "$ref": "#/definitions/MCPRole" },
          "architect": { "$ref": "#/definitions/MCPRole" },
          "analyst": { "$ref": "#/definitions/MCPRole" },
          "product": { "type": "string" },
          "category": { "type": "string" },
          "status": {
            "enum": ["active", "maintenance", "deprecated", "archived"]
          },
          "tags": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["path", "owner", "status"]
      }
    }
  },
  "definitions": {
    "MCPRole": {
      "enum": [
        "ceo", "cto", "cpo", "cfo", "cmo", "coo",
        "coregfx-po", "cryo-po", "nuna-po", "arctic-po",
        "coregfx-ba", "cryo-ba", "nuna-ba", "arctic-ba",
        "coregfx-architect", "cryo-architect", "nuna-architect",
        "arctic-architect", "infra-architect"
      ]
    }
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation
1. **core protocol types** - Message types, interfaces
2. **context-store schema** - JSON schemas for all stores
3. **CEO-MCP** - Portfolio overview, strategic priorities
4. **CTO-MCP** - Technical standards, coordination
5. **Infra-Architect-MCP** - MCP orchestration, routing

### Phase 2: First Product Vertical (CoreGFX)
1. **CoreGFX-PO-MCP** - Backlog management
2. **CoreGFX-Architect-MCP** - Technical design
3. **CoreGFX-BA-MCP** - Requirements analysis

### Phase 3: Remaining Products
- Cryo stack (PO, Architect, BA)
- Nuna stack (PO, Architect, BA)
- Arctic stack (PO, Architect, BA)

### Phase 4: Supporting Roles
- CPO-MCP (if needed for multi-product coordination)
- CFO-MCP (cost analysis)
- CMO-MCP (documentation)
- COO-MCP (operations)
