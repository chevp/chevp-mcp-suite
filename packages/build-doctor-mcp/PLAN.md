# Build Doctor MCP - Implementation Plan

## Overview

A dedicated MCP server that captures build errors, stores error→fix mappings, and provides intelligent fix suggestions based on learned patterns.

## Architecture Decision

**Create a new `build-doctor-mcp` package** rather than extending `infra-architect` because:

1. **Single Responsibility**: infra-architect handles orchestration and config management; build-doctor handles error intelligence
2. **Stateful Data**: build-doctor maintains a persistent knowledge base of errors/fixes
3. **Independent Evolution**: Can iterate on error patterns without touching infrastructure
4. **Clear Ownership**: Dedicated package for build-related tooling

## Package Structure

```
packages/build-doctor-mcp/
├── package.json
├── tsconfig.json
├── project.json
├── src/
│   ├── index.ts              # Server setup
│   ├── stdio.ts              # Entry point
│   ├── types/
│   │   └── index.ts          # Type definitions
│   ├── data/
│   │   └── error-store.ts    # Error pattern storage layer
│   ├── patterns/
│   │   ├── cmake.ts          # CMake error patterns
│   │   ├── cpp-compiler.ts   # C++ compiler patterns (MSVC, GCC, Clang)
│   │   └── linker.ts         # Linker error patterns
│   └── tools/
│       ├── analyze-error.ts  # Parse and match errors
│       ├── get-fix.ts        # Get fix for known error
│       ├── learn-fix.ts      # Record new error→fix mapping
│       ├── list-patterns.ts  # List known error patterns
│       └── run-build.ts      # Run build and auto-diagnose
```

## Error Pattern Schema

```typescript
interface ErrorPattern {
  id: string;                    // Unique pattern ID
  category: 'cmake' | 'compiler' | 'linker' | 'runtime';
  compiler?: 'msvc' | 'gcc' | 'clang' | 'any';

  // Pattern matching
  regex: string;                 // Regex to match error message
  extractors?: Record<string, string>;  // Named capture groups

  // Context
  description: string;           // Human-readable description
  commonCauses: string[];        // Why this error occurs

  // Fixes
  fixes: Fix[];                  // Ordered by confidence/frequency

  // Learning metadata
  occurrences: number;           // How often seen
  lastSeen: string;              // ISO timestamp
  successRate: number;           // Fix success rate 0-1
}

interface Fix {
  id: string;
  description: string;           // What this fix does
  type: 'file_edit' | 'cmake_change' | 'dependency' | 'config' | 'manual';

  // Automated fix (if possible)
  autoFix?: {
    filePattern: string;         // Which file to modify
    search: string;              // What to find
    replace: string;             // What to replace with
  };

  // Manual guidance
  steps?: string[];              // Step-by-step instructions

  // Tracking
  appliedCount: number;          // How often this fix was used
  successCount: number;          // How often it resolved the issue
}
```

## Storage Format

File: `context-store/build-doctor/error-patterns.json`

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-01-15T10:00:00Z",
  "patterns": {
    "cmake-target-not-found": {
      "id": "cmake-target-not-found",
      "category": "cmake",
      "regex": "CMake Error.*Target \"([^\"]+)\" not found",
      "extractors": { "target": "$1" },
      "description": "CMake cannot find a referenced target",
      "commonCauses": [
        "Target defined in a CMakeLists.txt that wasn't added",
        "Typo in target name",
        "Missing add_subdirectory() call"
      ],
      "fixes": [
        {
          "id": "add-subdirectory",
          "description": "Add missing add_subdirectory() for the target",
          "type": "cmake_change",
          "steps": [
            "Find the CMakeLists.txt that defines '${target}'",
            "Add add_subdirectory(path/to/target) in parent CMakeLists.txt"
          ],
          "appliedCount": 15,
          "successCount": 14
        }
      ],
      "occurrences": 23,
      "lastSeen": "2025-01-15T10:00:00Z",
      "successRate": 0.91
    }
  },
  "customPatterns": {}
}
```

## Tool Definitions

### 1. `analyze_error`

Parses build output and identifies matching error patterns.

```typescript
{
  name: 'analyze_error',
  description: 'Analyze build error output and find matching patterns',
  params: {
    error_output: string,        // Raw build output
    build_system?: 'cmake' | 'msbuild' | 'make',
    compiler?: 'msvc' | 'gcc' | 'clang'
  },
  returns: {
    matches: Array<{
      pattern: ErrorPattern,
      confidence: number,        // 0-1 match confidence
      extracted: Record<string, string>,  // Extracted values
      suggestedFixes: Fix[]
    }>,
    unknownErrors: string[]      // Errors without patterns
  }
}
```

### 2. `get_fix`

Gets the best fix for a known error pattern.

```typescript
{
  name: 'get_fix',
  description: 'Get recommended fix for a known error pattern',
  params: {
    pattern_id: string,
    context?: {
      file?: string,
      project?: string
    }
  },
  returns: {
    pattern: ErrorPattern,
    recommendedFix: Fix,
    alternativeFixes: Fix[],
    autoFixAvailable: boolean
  }
}
```

### 3. `learn_fix`

Records a new error→fix mapping or updates existing success rates.

```typescript
{
  name: 'learn_fix',
  description: 'Learn from a successfully applied fix',
  params: {
    action: 'record_new' | 'mark_success' | 'mark_failure',

    // For record_new
    error_output?: string,
    fix_description?: string,
    fix_type?: string,
    fix_steps?: string[],

    // For mark_success/failure
    pattern_id?: string,
    fix_id?: string
  },
  returns: {
    patternId: string,
    fixId: string,
    status: 'created' | 'updated' | 'recorded'
  }
}
```

### 4. `list_patterns`

Lists all known error patterns, optionally filtered.

```typescript
{
  name: 'list_patterns',
  description: 'List known error patterns',
  params: {
    category?: 'cmake' | 'compiler' | 'linker',
    compiler?: 'msvc' | 'gcc' | 'clang',
    min_occurrences?: number
  },
  returns: {
    patterns: ErrorPattern[],
    statistics: {
      totalPatterns: number,
      byCategory: Record<string, number>,
      averageSuccessRate: number
    }
  }
}
```

### 5. `run_build`

Executes a build and automatically analyzes any errors.

```typescript
{
  name: 'run_build',
  description: 'Run build command and auto-analyze errors',
  params: {
    project_path: string,
    build_command?: string,      // Default: detect from project
    build_type?: 'debug' | 'release'
  },
  returns: {
    success: boolean,
    output: string,
    errors?: Array<{
      line: number,
      message: string,
      matchedPattern?: ErrorPattern,
      suggestedFix?: Fix
    }>,
    autoFixable: number          // Count of errors with auto-fix
  }
}
```

## Pre-seeded Error Patterns

### CMake Patterns

| ID | Regex | Description |
|----|-------|-------------|
| `cmake-target-not-found` | `Target "([^"]+)" not found` | Missing target dependency |
| `cmake-package-not-found` | `Could not find.*package.*"([^"]+)"` | Missing find_package |
| `cmake-syntax-error` | `CMake Error at ([^:]+):(\d+)` | CMakeLists.txt syntax error |
| `cmake-version-mismatch` | `CMake.*version.*(\d+\.\d+).*required` | Version requirement not met |

### MSVC Compiler Patterns

| ID | Regex | Description |
|----|-------|-------------|
| `msvc-c2065` | `error C2065:.*'([^']+)'.*undeclared` | Undeclared identifier |
| `msvc-c2079` | `error C2079:.*uses undefined` | Undefined class/struct |
| `msvc-c2143` | `error C2143:.*syntax error.*missing '([^']+)'` | Missing token |
| `msvc-lnk2019` | `error LNK2019:.*unresolved external symbol "([^"]+)"` | Unresolved symbol |
| `msvc-lnk2001` | `error LNK2001:.*unresolved external symbol` | Missing implementation |

### GCC/Clang Patterns

| ID | Regex | Description |
|----|-------|-------------|
| `gcc-undeclared` | `error:.*'([^']+)'.*was not declared` | Undeclared identifier |
| `gcc-undefined-ref` | `undefined reference to.*'([^']+)'` | Linker: missing symbol |
| `gcc-no-member` | `error:.*no member named '([^']+)'` | Unknown member access |
| `gcc-expected` | `error:.*expected '([^']+)'` | Syntax error |

## Integration with Workflow

### Automatic Error Learning

When Claude fixes a build error manually:

1. Claude runs build → gets error
2. Claude fixes the code
3. Claude runs build → success
4. **build-doctor** automatically records the error→fix mapping

### Fix Suggestion Flow

```
User: "Fix the build"
       ↓
Claude: run_build(project_path)
       ↓
build-doctor: {errors: [{pattern: 'msvc-lnk2019', fix: {...}}]}
       ↓
Claude: "Found LNK2019 - missing symbol 'foo'.
        Known fix: Add foo.cpp to target sources.
        Applying fix..."
       ↓
build-doctor: learn_fix(mark_success, pattern_id, fix_id)
```

## Implementation Steps

1. **Create package scaffolding**
   - package.json, tsconfig.json, project.json
   - Basic src structure

2. **Implement types and storage**
   - ErrorPattern, Fix interfaces
   - JSON-based ErrorStore class

3. **Pre-seed patterns**
   - CMake patterns (10-15 common errors)
   - MSVC patterns (20-30 common errors)
   - GCC/Clang patterns (15-20 common errors)

4. **Implement tools**
   - analyze_error (pattern matching)
   - get_fix (fix retrieval)
   - learn_fix (pattern learning)
   - list_patterns (discovery)
   - run_build (integration)

5. **Register in .mcp.json**
   - Add build-doctor server entry

6. **Test with real builds**
   - Run against coregfx C++ builds
   - Validate pattern matching
   - Tune regex patterns

## Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@mcp-suite/core": "workspace:*",
    "zod": "^3.23.0"
  }
}
```

## Success Criteria

1. Correctly identifies 80%+ of common C++/CMake errors
2. Provides actionable fixes for 70%+ of identified errors
3. Learning system improves fix suggestions over time
4. Auto-fix available for 30%+ of patterns
5. Sub-second pattern matching response time
