/**
 * Error Pattern Storage Layer
 *
 * Handles loading, saving, and querying error patterns.
 */

import fs from 'node:fs';
import path from 'node:path';
import type {
  ErrorPattern,
  ErrorPatternStore,
  Fix,
  ErrorCategory,
  CompilerType,
} from '../types/index.js';

// Import pre-seeded patterns
import { CMAKE_PATTERNS } from '../patterns/cmake.js';
import { MSVC_PATTERNS } from '../patterns/cpp-compiler.js';
import { GCC_CLANG_PATTERNS } from '../patterns/linker.js';

const DEFAULT_STORE_PATH = 'c:/chevp/tools/chevp-mcp-suite/context-store/build-doctor';
const PATTERNS_FILE = 'error-patterns.json';

export class ErrorStore {
  private storePath: string;
  private data: ErrorPatternStore;

  constructor(storePath?: string) {
    this.storePath = storePath ?? process.env.BUILD_DOCTOR_STORE ?? DEFAULT_STORE_PATH;
    this.data = this.loadOrInitialize();
  }

  /**
   * Load existing store or initialize with pre-seeded patterns
   */
  private loadOrInitialize(): ErrorPatternStore {
    const filePath = path.join(this.storePath, PATTERNS_FILE);

    // Ensure directory exists
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }

    // Try to load existing data
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const loaded = JSON.parse(content) as ErrorPatternStore;

        // Merge with pre-seeded patterns (pre-seeded take precedence for structure)
        return this.mergeWithPreseeded(loaded);
      } catch (error) {
        console.error('[build-doctor] Failed to load patterns, reinitializing:', error);
      }
    }

    // Initialize with pre-seeded patterns
    return this.createInitialStore();
  }

  /**
   * Create initial store with all pre-seeded patterns
   */
  private createInitialStore(): ErrorPatternStore {
    const patterns: Record<string, ErrorPattern> = {};

    // Add all pre-seeded patterns
    for (const pattern of [...CMAKE_PATTERNS, ...MSVC_PATTERNS, ...GCC_CLANG_PATTERNS]) {
      patterns[pattern.id] = pattern;
    }

    const store: ErrorPatternStore = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      patterns,
      customPatterns: {},
    };

    this.saveStore(store);
    return store;
  }

  /**
   * Merge loaded data with pre-seeded patterns
   * Preserves user statistics but updates pattern definitions
   */
  private mergeWithPreseeded(loaded: ErrorPatternStore): ErrorPatternStore {
    const preseeded: Record<string, ErrorPattern> = {};

    for (const pattern of [...CMAKE_PATTERNS, ...MSVC_PATTERNS, ...GCC_CLANG_PATTERNS]) {
      const existing = loaded.patterns[pattern.id];
      if (existing) {
        // Preserve user statistics
        preseeded[pattern.id] = {
          ...pattern,
          occurrences: existing.occurrences,
          lastSeen: existing.lastSeen,
          successRate: existing.successRate,
          fixes: pattern.fixes.map((fix, i) => {
            const existingFix = existing.fixes[i];
            if (existingFix && existingFix.id === fix.id) {
              return {
                ...fix,
                appliedCount: existingFix.appliedCount,
                successCount: existingFix.successCount,
              };
            }
            return fix;
          }),
        };
      } else {
        preseeded[pattern.id] = pattern;
      }
    }

    return {
      ...loaded,
      patterns: preseeded,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Save store to disk
   */
  private saveStore(store?: ErrorPatternStore): void {
    const data = store ?? this.data;
    const filePath = path.join(this.storePath, PATTERNS_FILE);
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Get all patterns (both pre-seeded and custom)
   */
  getAllPatterns(): ErrorPattern[] {
    return [
      ...Object.values(this.data.patterns),
      ...Object.values(this.data.customPatterns),
    ];
  }

  /**
   * Get patterns filtered by criteria
   */
  getPatterns(filters?: {
    category?: ErrorCategory;
    compiler?: CompilerType;
    minOccurrences?: number;
  }): ErrorPattern[] {
    let patterns = this.getAllPatterns();

    if (filters?.category) {
      patterns = patterns.filter((p) => p.category === filters.category);
    }

    if (filters?.compiler) {
      patterns = patterns.filter(
        (p) => !p.compiler || p.compiler === 'any' || p.compiler === filters.compiler
      );
    }

    if (filters?.minOccurrences !== undefined) {
      patterns = patterns.filter((p) => p.occurrences >= filters.minOccurrences!);
    }

    return patterns;
  }

  /**
   * Get a specific pattern by ID
   */
  getPattern(id: string): ErrorPattern | null {
    return this.data.patterns[id] ?? this.data.customPatterns[id] ?? null;
  }

  /**
   * Match error text against all patterns
   */
  matchError(errorText: string): Array<{
    pattern: ErrorPattern;
    confidence: number;
    extracted: Record<string, string>;
  }> {
    const matches: Array<{
      pattern: ErrorPattern;
      confidence: number;
      extracted: Record<string, string>;
    }> = [];

    for (const pattern of this.getAllPatterns()) {
      try {
        const regex = new RegExp(pattern.regex, 'i');
        const match = errorText.match(regex);

        if (match) {
          const extracted: Record<string, string> = {};

          // Extract named groups if defined
          if (pattern.extractors) {
            for (const [name, groupRef] of Object.entries(pattern.extractors)) {
              const groupNum = parseInt(groupRef.replace('$', ''), 10);
              if (!isNaN(groupNum) && match[groupNum]) {
                extracted[name] = match[groupNum];
              }
            }
          }

          // Calculate confidence based on match specificity
          const confidence = this.calculateConfidence(pattern, match, errorText);

          matches.push({ pattern, confidence, extracted });
        }
      } catch (error) {
        console.error(`[build-doctor] Invalid regex in pattern ${pattern.id}:`, error);
      }
    }

    // Sort by confidence descending
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate match confidence
   */
  private calculateConfidence(
    pattern: ErrorPattern,
    match: RegExpMatchArray,
    fullText: string
  ): number {
    let confidence = 0.5; // Base confidence for any match

    // Higher confidence for more specific matches
    const matchRatio = match[0].length / fullText.length;
    confidence += matchRatio * 0.3;

    // Higher confidence for patterns with good success rate
    confidence += pattern.successRate * 0.2;

    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }

  /**
   * Record that a pattern was matched
   */
  recordMatch(patternId: string): void {
    const pattern =
      this.data.patterns[patternId] ?? this.data.customPatterns[patternId];

    if (pattern) {
      pattern.occurrences++;
      pattern.lastSeen = new Date().toISOString();
      this.saveStore();
    }
  }

  /**
   * Record fix application result
   */
  recordFixResult(patternId: string, fixId: string, success: boolean): void {
    const pattern =
      this.data.patterns[patternId] ?? this.data.customPatterns[patternId];

    if (pattern) {
      const fix = pattern.fixes.find((f) => f.id === fixId);
      if (fix) {
        fix.appliedCount++;
        if (success) {
          fix.successCount++;
        }

        // Recalculate pattern success rate
        const totalApplied = pattern.fixes.reduce((sum, f) => sum + f.appliedCount, 0);
        const totalSuccess = pattern.fixes.reduce((sum, f) => sum + f.successCount, 0);
        pattern.successRate = totalApplied > 0 ? totalSuccess / totalApplied : 0;

        this.saveStore();
      }
    }
  }

  /**
   * Add a new custom pattern
   */
  addCustomPattern(pattern: ErrorPattern): void {
    this.data.customPatterns[pattern.id] = pattern;
    this.saveStore();
  }

  /**
   * Add a fix to an existing pattern
   */
  addFixToPattern(patternId: string, fix: Fix): void {
    const pattern =
      this.data.patterns[patternId] ?? this.data.customPatterns[patternId];

    if (pattern) {
      // Check if fix already exists
      const existingIndex = pattern.fixes.findIndex((f) => f.id === fix.id);
      if (existingIndex >= 0) {
        pattern.fixes[existingIndex] = fix;
      } else {
        pattern.fixes.push(fix);
      }
      this.saveStore();
    }
  }

  /**
   * Get statistics about the pattern store
   */
  getStatistics(): {
    totalPatterns: number;
    preseededPatterns: number;
    customPatterns: number;
    byCategory: Record<string, number>;
    byCompiler: Record<string, number>;
    averageSuccessRate: number;
    totalOccurrences: number;
  } {
    const all = this.getAllPatterns();
    const byCategory: Record<string, number> = {};
    const byCompiler: Record<string, number> = {};

    let totalSuccessRate = 0;
    let totalOccurrences = 0;

    for (const pattern of all) {
      byCategory[pattern.category] = (byCategory[pattern.category] ?? 0) + 1;

      const compiler = pattern.compiler ?? 'any';
      byCompiler[compiler] = (byCompiler[compiler] ?? 0) + 1;

      totalSuccessRate += pattern.successRate;
      totalOccurrences += pattern.occurrences;
    }

    return {
      totalPatterns: all.length,
      preseededPatterns: Object.keys(this.data.patterns).length,
      customPatterns: Object.keys(this.data.customPatterns).length,
      byCategory,
      byCompiler,
      averageSuccessRate: all.length > 0 ? totalSuccessRate / all.length : 0,
      totalOccurrences,
    };
  }
}

/**
 * Create a singleton error store instance
 */
let storeInstance: ErrorStore | null = null;

export function getErrorStore(storePath?: string): ErrorStore {
  if (!storeInstance) {
    storeInstance = new ErrorStore(storePath);
  }
  return storeInstance;
}
