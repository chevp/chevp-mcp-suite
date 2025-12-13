// =============================================================================
// VFP MCP - DIFF Tool (Git-like)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerDiff(server: McpServer): void {
  server.tool(
    'vfp_diff',
    'Compare two versions (Git diff equivalent)',
    {
      fromTick: z.number().describe('Start version tick'),
      toTick: z.number().describe('End version tick'),
      path: z.string().optional().describe('Filter by path prefix'),
    },
    async ({ fromTick, toTick, path }) => {
      const store = getStore();

      const fromVersion = {
        tick: fromTick,
        branch: store.getCurrentBranch(),
        timestamp: Date.now(),
      };

      const toVersion = {
        tick: toTick,
        branch: store.getCurrentBranch(),
        timestamp: Date.now(),
      };

      const changes = store.diff(fromVersion, toVersion, path);

      // Format as diff output
      const diffLines: string[] = [];
      for (const change of changes) {
        switch (change.type) {
          case 'add':
            diffLines.push(`+ ${change.path}`);
            break;
          case 'delete':
            diffLines.push(`- ${change.path}`);
            break;
          case 'modify':
            diffLines.push(`~ ${change.path}`);
            if (change.oldValue) {
              diffLines.push(`  - ${change.oldValue}`);
            }
            if (change.newValue) {
              diffLines.push(`  + ${change.newValue}`);
            }
            break;
        }
      }

      const additions = changes.filter(c => c.type === 'add').length;
      const deletions = changes.filter(c => c.type === 'delete').length;
      const modifications = changes.filter(c => c.type === 'modify').length;

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'ok',
            from: fromVersion,
            to: toVersion,
            path: path || '/',
            changes,
            summary: {
              additions,
              deletions,
              modifications,
              total: changes.length,
            },
            display: diffLines.join('\n') || 'No changes',
          }, null, 2),
        }],
      };
    }
  );
}