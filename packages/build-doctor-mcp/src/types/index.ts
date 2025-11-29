/**
 * Build Doctor MCP Type Definitions
 */

export type ErrorCategory = 'cmake' | 'compiler' | 'linker' | 'runtime';
export type CompilerType = 'msvc' | 'gcc' | 'clang' | 'any';
export type FixType = 'file_edit' | 'cmake_change' | 'dependency' | 'config' | 'manual';
export type BuildSystem = 'cmake' | 'msbuild' | 'make' | 'ninja';

/**
 * Automatic fix definition for patterns that can be auto-corrected
 */
export interface AutoFix {
  /** Glob pattern for files to modify */
  filePattern: string;
  /** Regex or string to search for */
  search: string;
  /** Replacement string (can use $1, $2 for captured groups) */
  replace: string;
}

/**
 * A fix suggestion for an error pattern
 */
export interface Fix {
  /** Unique fix identifier */
  id: string;
  /** Human-readable description of what this fix does */
  description: string;
  /** Type of fix */
  type: FixType;
  /** Automated fix configuration (if available) */
  autoFix?: AutoFix;
  /** Manual step-by-step instructions */
  steps?: string[];
  /** Number of times this fix was applied */
  appliedCount: number;
  /** Number of successful applications */
  successCount: number;
}

/**
 * An error pattern that can be matched against build output
 */
export interface ErrorPattern {
  /** Unique pattern identifier */
  id: string;
  /** Error category */
  category: ErrorCategory;
  /** Specific compiler (if applicable) */
  compiler?: CompilerType;
  /** Regex pattern to match error message */
  regex: string;
  /** Named capture group extractors */
  extractors?: Record<string, string>;
  /** Human-readable description */
  description: string;
  /** Common causes of this error */
  commonCauses: string[];
  /** Available fixes, ordered by success rate */
  fixes: Fix[];
  /** Number of times this pattern was matched */
  occurrences: number;
  /** Last time this pattern was seen (ISO 8601) */
  lastSeen: string;
  /** Overall success rate of fixes (0-1) */
  successRate: number;
}

/**
 * Error pattern storage format
 */
export interface ErrorPatternStore {
  version: string;
  lastUpdated: string;
  /** Built-in patterns from pre-seeded data */
  patterns: Record<string, ErrorPattern>;
  /** User-learned patterns */
  customPatterns: Record<string, ErrorPattern>;
}

/**
 * Result of analyzing build output
 */
export interface AnalysisMatch {
  /** Matched pattern */
  pattern: ErrorPattern;
  /** Match confidence (0-1) */
  confidence: number;
  /** Values extracted from regex groups */
  extracted: Record<string, string>;
  /** Suggested fixes ordered by success rate */
  suggestedFixes: Fix[];
  /** Original error line */
  errorLine: string;
  /** Line number in build output */
  lineNumber?: number;
}

/**
 * Result of error analysis
 */
export interface AnalysisResult {
  /** Matched error patterns */
  matches: AnalysisMatch[];
  /** Errors that didn't match any pattern */
  unknownErrors: string[];
  /** Build system detected */
  buildSystem?: BuildSystem;
  /** Compiler detected */
  compiler?: CompilerType;
}

/**
 * Build execution result
 */
export interface BuildResult {
  /** Whether the build succeeded */
  success: boolean;
  /** Raw build output */
  output: string;
  /** Exit code */
  exitCode: number;
  /** Parsed errors with pattern matches */
  errors?: Array<{
    line: number;
    message: string;
    matchedPattern?: ErrorPattern;
    suggestedFix?: Fix;
  }>;
  /** Count of errors that have auto-fix available */
  autoFixable: number;
  /** Build duration in milliseconds */
  durationMs: number;
}
