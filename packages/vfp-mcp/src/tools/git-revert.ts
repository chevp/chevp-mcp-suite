// =============================================================================
// VFP MCP - REVERT Tool (Git-like)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerRevert(server: McpServer): void {
  server.tool(
    'vfp_revert',
    'Revert to a previous version (Git revert equivalent)',
    {
      toTick: z.number().describe('Target version tick to revert to'),
      path: z.string().optional().describe('Revert only specific path'),
    },
    async ({ toTick, path }) => {
      const store = getStore();

      const toVersion = {
        tick: toTick,
        branch: store.getCurrentBranch(),
        timestamp: Date.now(),
      };

      const result = store.revert(toVersion, path);

      if (!result.success) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              status: 'error',
              error: result.error,
            }, null, 2),
          }],
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'ok',
            revertedTo: toVersion,
            path: path || '/',
            currentTick: store.getCurrentTick(),
            message: `Reverted to tick:${toTick}`,
          }, null, 2),
        }],
      };
    }
  );
}