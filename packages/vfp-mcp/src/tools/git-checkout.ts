// =============================================================================
// VFP MCP - CHECKOUT Tool (Git-like)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerCheckout(server: McpServer): void {
  server.tool(
    'vfp_checkout',
    'Switch to a different branch (Git checkout equivalent)',
    {
      branch: z.string().describe('Branch name to switch to'),
    },
    async ({ branch }) => {
      const store = getStore();

      const previousBranch = store.getCurrentBranch();
      const result = store.checkout(branch);

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
            previousBranch,
            currentBranch: branch,
            message: `Switched to branch '${branch}'`,
          }, null, 2),
        }],
      };
    }
  );
}