# SAFe 6.0 Development Workflow

## Overview

This document defines the value stream delivery workflow using SAFe 6.0 principles, implemented through MCP orchestration.

---

## MCP Role Alignment with SAFe 6.0

```
SAFe 6.0 Role              │ MCP Implementation
───────────────────────────┼─────────────────────────────────────
Portfolio Level            │
  Epic Owner               │ Strategy-MCP (strategic epics)
  Enterprise Architect     │ Standards-MCP (solution architecture)
                           │
Program Level (ART)        │
  Release Train Engineer   │ Release-MCP (ART coordination)
  Product Management       │ Product-MCP + Product-PO-MCPs
  System Architect         │ Product-Architect-MCPs
                           │
Team Level                 │
  Scrum Master             │ Team-Sync-MCP (per team/product)
  Product Owner            │ Product-PO-MCPs
  Business Analyst         │ Product-BA-MCPs
  Developer                │ (Human + Claude Code)
```

---

## 6-Step Value Stream Workflow

### Step 1: IDEATE - Epic Creation & Approval

**Owner:** Strategy-MCP + Release-MCP
**Input:** Business need, market opportunity, strategic goal
**Output:** Approved Epic with business case

```
┌─────────────────────────────────────────────────────────────────┐
│  IDEATE                                                         │
│                                                                 │
│  Strategy-MCP                    Release-MCP                    │
│  ┌──────────────┐          ┌──────────────┐                     │
│  │ create_epic  │ ───────► │ validate_epic│                     │
│  │              │          │ fit_to_art   │                     │
│  └──────────────┘          └──────────────┘                     │
│         │                         │                             │
│         ▼                         ▼                             │
│  ┌──────────────┐          ┌──────────────┐                     │
│  │ approve_epic │ ◄─────── │ epic_ready   │                     │
│  │ (go/no-go)   │          │ _for_backlog │                     │
│  └──────────────┘          └──────────────┘                     │
│                                                                 │
│  Artifacts: Epic, Business Case, Lean Business Canvas           │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2: ANALYZE - Feature Breakdown

**Owner:** Release-MCP + Product-PO-MCPs + Product-BA-MCPs
**Input:** Approved Epic
**Output:** Features with acceptance criteria

```
┌─────────────────────────────────────────────────────────────────┐
│  ANALYZE                                                        │
│                                                                 │
│  Release-MCP                                                    │
│  ┌──────────────────┐                                           │
│  │ decompose_epic   │                                           │
│  │ to_features      │                                           │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌────────────────────────────────────────────┐                 │
│  │        Parallel Feature Analysis            │                │
│  │                                             │                │
│  │  PO-MCP           BA-MCP         Architect  │                │
│  │  ┌──────┐        ┌──────┐        ┌──────┐   │                │
│  │  │define│        │write │        │assess│   │                │
│  │  │value │        │accept│        │tech  │   │                │
│  │  │props │        │crit  │        │risk  │   │                │
│  │  └──────┘        └──────┘        └──────┘   │                │
│  └────────────────────────────────────────────┘                 │
│                                                                 │
│  Artifacts: Features, Acceptance Criteria, NFRs                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 3: PLAN - PI Planning & Sprint Planning

**Owner:** Release-MCP + Team-Sync-MCP
**Input:** Features, Team capacity
**Output:** PI Plan, Sprint backlogs

```
┌─────────────────────────────────────────────────────────────────┐
│  PLAN                                                           │
│                                                                 │
│  Release-MCP (PI Level)         Team-Sync-MCP (Sprint Level)    │
│  ┌──────────────┐          ┌──────────────┐                     │
│  │ plan_pi      │ ───────► │ plan_sprint  │                     │
│  │              │          │              │                     │
│  └──────────────┘          └──────────────┘                     │
│         │                         │                             │
│         ▼                         ▼                             │
│  ┌──────────────┐          ┌──────────────┐                     │
│  │ assign_      │          │ create_      │                     │
│  │ features_to_ │          │ sprint_      │                     │
│  │ iterations   │          │ backlog      │                     │
│  └──────────────┘          └──────────────┘                     │
│                                                                 │
│  Artifacts: PI Objectives, Sprint Goals, Team Backlogs          │
└─────────────────────────────────────────────────────────────────┘
```

### Step 4: BUILD - Development & Integration

**Owner:** Team-Sync-MCP + Standards-MCP
**Input:** Sprint backlog
**Output:** Working increment

```
┌─────────────────────────────────────────────────────────────────┐
│  BUILD                                                          │
│                                                                 │
│  Team-Sync-MCP                  Standards-MCP                   │
│  ┌──────────────┐                 ┌──────────────┐              │
│  │ track_sprint │                 │ enforce_     │              │
│  │ progress     │                 │ standards    │              │
│  └──────────────┘                 └──────────────┘              │
│         │                               │                       │
│         ▼                               ▼                       │
│  ┌──────────────┐                 ┌──────────────┐              │
│  │ facilitate_  │                 │ review_      │              │
│  │ daily_scrum  │                 │ architecture │              │
│  └──────────────┘                 └──────────────┘              │
│         │                               │                       │
│         └───────────────┬───────────────┘                       │
│                         ▼                                       │
│                  ┌──────────────┐                               │
│                  │ integration  │                               │
│                  │ validation   │                               │
│                  └──────────────┘                               │
│                                                                 │
│  Artifacts: Tested Code, Integration Reports                    │
└─────────────────────────────────────────────────────────────────┘
```

### Step 5: VALIDATE - System Demo & Review

**Owner:** Release-MCP + Team-Sync-MCP + PO-MCPs
**Input:** Working increment
**Output:** Validated features, feedback

```
┌─────────────────────────────────────────────────────────────────┐
│  VALIDATE                                                       │
│                                                                 │
│  Team-Sync-MCP          Release-MCP               PO-MCP        │
│  ┌──────────────┐         ┌──────────────┐      ┌──────────┐    │
│  │ run_sprint   │ ──────► │ run_system   │ ◄─── │ accept_  │    │
│  │ review       │         │ demo         │      │ features │    │
│  └──────────────┘         └──────────────┘      └──────────┘    │
│         │                        │                    │         │
│         ▼                        ▼                    ▼         │
│  ┌──────────────┐         ┌──────────────┐      ┌──────────┐    │
│  │ collect_     │         │ aggregate_   │      │ update_  │    │
│  │ team_        │ ──────► │ feedback     │ ◄─── │ backlog  │    │
│  │ retrospective│         └──────────────┘      └──────────┘    │
│  └──────────────┘                                               │
│                                                                 │
│  Artifacts: Demo Recording, Feedback, Retrospective Actions     │
└─────────────────────────────────────────────────────────────────┘
```

### Step 6: RELEASE - Deployment & Value Delivery

**Owner:** Release-MCP + Ops-MCP (if implemented)
**Input:** Validated increment
**Output:** Released value, metrics

```
┌─────────────────────────────────────────────────────────────────┐
│  RELEASE                                                        │
│                                                                 │
│  Release-MCP                              Strategy-MCP          │
│  ┌──────────────┐                    ┌──────────────┐           │
│  │ prepare_     │                    │ approve_     │           │
│  │ release      │ ─────────────────► │ release      │           │
│  └──────────────┘                    └──────────────┘           │
│         │                                   │                   │
│         ▼                                   ▼                   │
│  ┌──────────────┐                    ┌──────────────┐           │
│  │ coordinate_  │                    │ measure_     │           │
│  │ deployment   │                    │ business_    │           │
│  └──────────────┘                    │ value        │           │
│         │                            └──────────────┘           │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │ close_pi     │                                               │
│  │ report_      │                                               │
│  │ metrics      │                                               │
│  └──────────────┘                                               │
│                                                                 │
│  Artifacts: Release Notes, Value Metrics, PI Report             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete MCP Hierarchy with SAFe Roles

```
Strategy-MCP (Epic Owner)
│
├── Standards-MCP (Enterprise Architect)
│   │
│   └── Release-MCP (Release Train Engineer) ◄── coordinates all ARTs
│       │
│       └── Agile Release Train
│           │
│           └── Team-Sync-MCP (orchestrates all teams)
│               │
│               ├── CoreGFX Team → CoreGFX PO + BA + Architect
│               ├── Cryo Team    → Cryo PO + BA + Architect
│               └── Nuna Team    → Nuna PO + BA + Architect
│
├── Product-MCP (Product Management)
├── Cost-MCP
├── Docs-MCP
└── Ops-MCP (Release)

Technical oversight from Standards-MCP
```

---

## Release-MCP Responsibilities

```yaml
name: release-mcp
role: Release Train Engineer
responsibility: ART coordination, PI planning, value stream optimization

tools:
  # Epic Management
  - name: create_epic
    description: Create a new SAFe epic with business case
    params:
      title: string
      description: string
      businessCase: BusinessCase
      mvp: string
      products: string[]

  - name: decompose_epic_to_features
    description: Break epic into features for teams
    params:
      epicId: string
      targetProducts: string[]

  # PI Planning
  - name: plan_pi
    description: Conduct PI planning
    params:
      piNumber: string
      duration: number  # in sprints
      objectives: PIObjective[]

  - name: assign_features_to_iterations
    description: Assign features to specific iterations
    params:
      piId: string
      assignments: FeatureAssignment[]

  # ART Coordination
  - name: run_system_demo
    description: Coordinate system demo
    params:
      piId: string
      iteration: number
      features: string[]

  - name: manage_dependencies
    description: Track and resolve cross-team dependencies
    params:
      action: 'identify' | 'track' | 'resolve'
      dependency?: Dependency

  - name: prepare_release
    description: Prepare for release
    params:
      piId: string
      releaseVersion: string
      releaseNotes: string

  # Metrics
  - name: get_art_metrics
    description: Get ART performance metrics
    returns: ARTMetrics

  - name: close_pi
    description: Close PI and generate report
    params:
      piId: string

reports_to: product
collaborates_with: [standards, team-sync, all product teams]
```

---

## Team-Sync-MCP Responsibilities

```yaml
name: team-sync-mcp
role: Scrum Master
responsibility: Team facilitation, impediment removal, process coaching

tools:
  # Sprint Management
  - name: plan_sprint
    description: Facilitate sprint planning
    params:
      team: string  # product team ID
      sprintNumber: number
      piId: string
      capacity: number

  - name: create_sprint_backlog
    description: Create sprint backlog from features
    params:
      sprintId: string
      stories: string[]
      commitments: SprintCommitment[]

  - name: track_sprint_progress
    description: Track daily progress
    params:
      sprintId: string

  # Ceremonies
  - name: facilitate_daily_scrum
    description: Generate daily scrum summary
    params:
      sprintId: string
      updates: DailyScrumUpdate[]

  - name: run_sprint_review
    description: Facilitate sprint review
    params:
      sprintId: string
      completedStories: string[]
      demo: DemoInfo

  - name: run_retrospective
    description: Facilitate retrospective
    params:
      sprintId: string
      format: 'start_stop_continue' | 'sailboat' | '4ls' | 'custom'

  # Impediment Management
  - name: manage_impediments
    description: Track and escalate impediments
    params:
      action: 'log' | 'escalate' | 'resolve'
      impediment?: Impediment

  # Team Health
  - name: get_team_velocity
    description: Calculate team velocity
    params:
      team: string
      sprints: number  # how many sprints to average

  - name: get_burndown
    description: Get sprint burndown data
    params:
      sprintId: string

reports_to: release
collaborates_with: [standards, product-po, product-architect, product-ba]
```

---

## Context Store Extensions for SAFe

```
context-store/
├── safe/
│   ├── epics/
│   │   ├── epic-001.json
│   │   └── ...
│   ├── features/
│   │   ├── feature-001.json
│   │   └── ...
│   ├── pis/
│   │   ├── pi-2025-q1/
│   │   │   ├── objectives.json
│   │   │   ├── plan.json
│   │   │   └── metrics.json
│   │   └── ...
│   └── art-config.json
├── sprints/
│   ├── current.json
│   └── history/
│       ├── sprint-001.json
│       └── ...
└── teams/
    ├── coregfx.json
    ├── cryo.json
    ├── nuna.json
    └── arctic.json
```

---

## Workflow Example: New Feature Development

```
1. IDEATE
   Strategy-MCP: create_strategic_priority(title="Vulkan 1.3 Support")
   Release-MCP: create_epic(title="Vulkan 1.3", products=["coregfx"])
   Strategy-MCP: approve_epic(epicId="epic-001")

2. ANALYZE
   Release-MCP: decompose_epic_to_features(epicId="epic-001")
   → Creates: feature-001 "Ray Tracing Pipeline"
   → Creates: feature-002 "Dynamic Rendering"

   CoreGFX-BA-MCP: define_acceptance_criteria(featureId="feature-001")
   CoreGFX-Architect-MCP: estimate_effort(featureId="feature-001")

3. PLAN
   Release-MCP: plan_pi(piNumber="2025-Q1", objectives=[...])
   Release-MCP: assign_features_to_iterations(piId="pi-2025-q1", ...)
   Team-Sync-MCP: plan_sprint(team="coregfx", sprintNumber=1)
   Team-Sync-MCP: create_sprint_backlog(sprintId="sprint-001", ...)

4. BUILD
   Team-Sync-MCP: track_sprint_progress(sprintId="sprint-001")
   Team-Sync-MCP: facilitate_daily_scrum(sprintId="sprint-001")
   Standards-MCP: enforce_standards(repos=["coregfx-*"])

5. VALIDATE
   Team-Sync-MCP: run_sprint_review(sprintId="sprint-001")
   Release-MCP: run_system_demo(piId="pi-2025-q1", iteration=1)
   CoreGFX-PO-MCP: accept_feature(featureId="feature-001")
   Team-Sync-MCP: run_retrospective(sprintId="sprint-001")

6. RELEASE
   Release-MCP: prepare_release(piId="pi-2025-q1", version="2.0.0")
   Strategy-MCP: approve_release(releaseId="rel-001")
   Release-MCP: close_pi(piId="pi-2025-q1")
```
