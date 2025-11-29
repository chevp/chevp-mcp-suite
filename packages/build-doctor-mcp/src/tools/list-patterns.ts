/**
 * List Patterns Tool
 *
 * Lists all known error patterns with optional filtering.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getErrorStore } from '../data/error-store.js';
import type { ErrorCategory, CompilerType } from '../types/index.js';

export function registerListPatterns(server: McpServer): void {
  server.tool(
    'list_patterns',
    'List known error patterns with statistics',
    {
      category: z
        .enum(['cmake', 'compiler', 'linker', 'runtime'])
        .optional()
        .describe('Filter by error category'),
      compiler: z
        .enum(['msvc', 'gcc', 'clang', 'any'])
        .optional()
        .describe('Filter by compiler'),
      min_occurrences: z
        .number()
        .optional()
        .describe('Only show patterns seen at least this many times'),
      include_fixes: z
        .boolean()
        .default(false)
        .describe('Include fix details in output'),
    },
    async ({ category, compiler, min_occurrences, include_fixes }) => {
      const store = getErrorStore();

      const patterns = store.getPatterns({
        category: category as ErrorCategory | undefined,
        compiler: compiler as CompilerType | undefined,
        minOccurrences: min_occurrences,
      });

      // Get statistics
      const statistics = store.getStatistics();

      // Format output
      const formattedPatterns = patterns.map((p) => ({
        id: p.id,
        category: p.category,
        compiler: p.compiler ?? 'any',
        description: p.description,
        occurrences: p.occurrences,
        successRate: Math.round(p.successRate * 100) + '%',
        fixCount: p.fixes.length,
        ...(include_fixes
          ? {
              fixes: p.fixes.map((f) => ({
                id: f.id,
                description: f.description,
                type: f.type,
                successRate:
                  f.appliedCount > 0
                    ? Math.round((f.successCount / f.appliedCount) * 100) + '%'
                    : 'N/A',
                appliedCount: f.appliedCount,
              })),
            }
          : {}),
      }));

      const result = {
        patterns: formattedPatterns,
        statistics: {
          totalPatterns: statistics.totalPatterns,
          preseededPatterns: statistics.preseededPatterns,
          customPatterns: statistics.customPatterns,
          byCategory: statistics.byCategory,
          byCompiler: statistics.byCompiler,
          averageSuccessRate: Math.round(statistics.averageSuccessRate * 100) + '%',
          totalOccurrences: statistics.totalOccurrences,
        },
        filters: {
          category: category ?? 'all',
          compiler: compiler ?? 'all',
          minOccurrences: min_occurrences ?? 0,
        },
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
