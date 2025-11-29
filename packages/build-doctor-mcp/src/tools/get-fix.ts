/**
 * Get Fix Tool
 *
 * Retrieves the best fix for a known error pattern.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getErrorStore } from '../data/error-store.js';
import type { ErrorPattern, Fix } from '../types/index.js';

export function registerGetFix(server: McpServer): void {
  server.tool(
    'get_fix',
    'Get recommended fix for a known error pattern',
    {
      pattern_id: z.string().describe('Error pattern ID'),
      context: z
        .object({
          file: z.string().optional().describe('File where error occurred'),
          project: z.string().optional().describe('Project name'),
          extracted: z.record(z.string()).optional().describe('Extracted values from pattern match'),
        })
        .optional()
        .describe('Additional context for fix selection'),
    },
    async ({ pattern_id, context }) => {
      const store = getErrorStore();
      const pattern = store.getPattern(pattern_id);

      if (!pattern) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'Pattern not found',
                patternId: pattern_id,
              }),
            },
          ],
        };
      }

      // Sort fixes by success rate
      const sortedFixes = [...pattern.fixes].sort((a, b) => {
        const aRate = a.appliedCount > 0 ? a.successCount / a.appliedCount : 0.5;
        const bRate = b.appliedCount > 0 ? b.successCount / b.appliedCount : 0.5;
        return bRate - aRate;
      });

      const recommendedFix = sortedFixes[0];
      const alternativeFixes = sortedFixes.slice(1);

      // Interpolate context into fix steps if available
      const interpolatedFix = context?.extracted
        ? interpolateFix(recommendedFix, context.extracted)
        : recommendedFix;

      const result = {
        pattern: {
          id: pattern.id,
          description: pattern.description,
          category: pattern.category,
          commonCauses: pattern.commonCauses,
          occurrences: pattern.occurrences,
          successRate: pattern.successRate,
        },
        recommendedFix: interpolatedFix,
        alternativeFixes: alternativeFixes.map((fix) =>
          context?.extracted ? interpolateFix(fix, context.extracted) : fix
        ),
        autoFixAvailable: !!recommendedFix?.autoFix,
        context: context ?? null,
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

/**
 * Interpolate extracted values into fix steps
 */
function interpolateFix(fix: Fix, extracted: Record<string, string>): Fix {
  const interpolate = (text: string): string => {
    let result = text;
    for (const [key, value] of Object.entries(extracted)) {
      result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
    }
    return result;
  };

  return {
    ...fix,
    description: interpolate(fix.description),
    steps: fix.steps?.map(interpolate),
    autoFix: fix.autoFix
      ? {
          ...fix.autoFix,
          search: interpolate(fix.autoFix.search),
          replace: interpolate(fix.autoFix.replace),
        }
      : undefined,
  };
}
