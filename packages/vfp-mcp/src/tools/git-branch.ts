// =============================================================================
// VFP MCP - BRANCH Tool (Git-like)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerBranch(server: McpServer): void {
  server.tool(
    'vfp_branch',
    'Create or list branches (Git branch equivalent)',
    {
      name: z.string().optional().describe('Branch name to create (omit to list branches)'),
    },
    async ({ name }) => {
      const store = getStore();

      if (name) {
        // Create branch
        const result = store.createBranch(name);

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
              branch: result.branch,
              message: `Branch '${name}' created from ${store.getCurrentBranch()}`,
            }, null, 2),
          }],
        };
      }

      // List branches
      const branches = store.listBranches();
      const currentBranch = store.getCurrentBranch();

      const branchLines = branches.map(b => {
        const marker = b.name === currentBranch ? '*' : ' ';
        return `${marker} ${b.name.padEnd(20)} tick:${b.head.tick}`;
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'ok',
            currentBranch,
            branches,
            display: branchLines.join('\n'),
          }, null, 2),
        }],
      };
    }
  );
}