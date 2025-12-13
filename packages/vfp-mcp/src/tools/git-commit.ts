// =============================================================================
// VFP MCP - COMMIT Tool (Git-like)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerCommit(server: McpServer): void {
  server.tool(
    'vfp_commit',
    'Create a version checkpoint (Git commit equivalent)',
    {
      message: z.string().describe('Commit message describing the changes'),
      paths: z.array(z.string()).optional().describe('Specific paths to commit (default: all changes)'),
    },
    async ({ message, paths }) => {
      const store = getStore();

      const result = store.commit(message, paths);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'ok',
            version: result.version,
            message,
            changes: result.changes,
            changeCount: result.changes.length,
            display: `Committed as tick:${result.version.tick} hash:${result.version.hash}`,
          }, null, 2),
        }],
      };
    }
  );
}