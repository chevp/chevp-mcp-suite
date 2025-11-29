/**
 * Learn Fix Tool
 *
 * Records new error→fix mappings or updates success rates.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getErrorStore } from '../data/error-store.js';
import type { ErrorPattern, Fix, ErrorCategory, FixType } from '../types/index.js';

export function registerLearnFix(server: McpServer): void {
  server.tool(
    'learn_fix',
    'Learn from a successfully applied fix or record a new error pattern',
    {
      action: z
        .enum(['record_new', 'mark_success', 'mark_failure', 'add_fix'])
        .describe('Action to perform'),

      // For record_new
      error_output: z
        .string()
        .optional()
        .describe('Error output to create pattern from (for record_new)'),
      error_regex: z
        .string()
        .optional()
        .describe('Regex pattern to match the error (for record_new)'),
      category: z
        .enum(['cmake', 'compiler', 'linker', 'runtime'])
        .optional()
        .describe('Error category (for record_new)'),
      description: z
        .string()
        .optional()
        .describe('Human-readable description (for record_new)'),
      common_causes: z
        .array(z.string())
        .optional()
        .describe('Common causes of this error (for record_new)'),

      // Fix information
      fix_description: z
        .string()
        .optional()
        .describe('Description of the fix'),
      fix_type: z
        .enum(['file_edit', 'cmake_change', 'dependency', 'config', 'manual'])
        .optional()
        .describe('Type of fix'),
      fix_steps: z
        .array(z.string())
        .optional()
        .describe('Step-by-step fix instructions'),

      // For mark_success/failure/add_fix
      pattern_id: z
        .string()
        .optional()
        .describe('Pattern ID (for mark_success/failure/add_fix)'),
      fix_id: z
        .string()
        .optional()
        .describe('Fix ID (for mark_success/failure)'),
    },
    async ({
      action,
      error_output,
      error_regex,
      category,
      description,
      common_causes,
      fix_description,
      fix_type,
      fix_steps,
      pattern_id,
      fix_id,
    }) => {
      const store = getErrorStore();

      switch (action) {
        case 'record_new': {
          // Validate required fields
          if (!error_regex || !category || !description) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({
                    error: 'Missing required fields',
                    required: ['error_regex', 'category', 'description'],
                  }),
                },
              ],
            };
          }

          // Generate pattern ID from description
          const newPatternId = generatePatternId(description);

          // Create fix if provided
          const fixes: Fix[] = [];
          if (fix_description && fix_type) {
            fixes.push({
              id: `${newPatternId}-fix-1`,
              description: fix_description,
              type: fix_type as FixType,
              steps: fix_steps,
              appliedCount: 0,
              successCount: 0,
            });
          }

          // Create new pattern
          const newPattern: ErrorPattern = {
            id: newPatternId,
            category: category as ErrorCategory,
            regex: error_regex,
            description,
            commonCauses: common_causes ?? [],
            fixes,
            occurrences: 1,
            lastSeen: new Date().toISOString(),
            successRate: 0,
          };

          store.addCustomPattern(newPattern);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  status: 'created',
                  patternId: newPatternId,
                  pattern: newPattern,
                }),
              },
            ],
          };
        }

        case 'add_fix': {
          if (!pattern_id || !fix_description || !fix_type) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({
                    error: 'Missing required fields',
                    required: ['pattern_id', 'fix_description', 'fix_type'],
                  }),
                },
              ],
            };
          }

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

          const newFixId = `${pattern_id}-fix-${pattern.fixes.length + 1}`;
          const newFix: Fix = {
            id: newFixId,
            description: fix_description,
            type: fix_type as FixType,
            steps: fix_steps,
            appliedCount: 0,
            successCount: 0,
          };

          store.addFixToPattern(pattern_id, newFix);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  status: 'fix_added',
                  patternId: pattern_id,
                  fixId: newFixId,
                  fix: newFix,
                }),
              },
            ],
          };
        }

        case 'mark_success': {
          if (!pattern_id || !fix_id) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({
                    error: 'Missing required fields',
                    required: ['pattern_id', 'fix_id'],
                  }),
                },
              ],
            };
          }

          store.recordFixResult(pattern_id, fix_id, true);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  status: 'recorded',
                  result: 'success',
                  patternId: pattern_id,
                  fixId: fix_id,
                }),
              },
            ],
          };
        }

        case 'mark_failure': {
          if (!pattern_id || !fix_id) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({
                    error: 'Missing required fields',
                    required: ['pattern_id', 'fix_id'],
                  }),
                },
              ],
            };
          }

          store.recordFixResult(pattern_id, fix_id, false);

          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  status: 'recorded',
                  result: 'failure',
                  patternId: pattern_id,
                  fixId: fix_id,
                }),
              },
            ],
          };
        }

        default:
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({ error: 'Unknown action' }),
              },
            ],
          };
      }
    }
  );
}

function generatePatternId(description: string): string {
  const timestamp = Date.now().toString(36);
  const slug = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);

  return `custom-${slug}-${timestamp}`;
}
