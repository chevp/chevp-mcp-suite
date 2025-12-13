// =============================================================================
// VFP MCP - DELETE Tool (FTP-like)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerDelete(server: McpServer): void {
  server.tool(
    'vfp_delete',
    'Delete a resource from the virtual file system (FTP DELE equivalent)',
    {
      path: z.string().describe('Path to delete'),
      recursive: z.boolean().optional().describe('Delete directory contents recursively'),
      message: z.string().optional().describe('Commit message for this deletion'),
    },
    async ({ path, recursive = false, message }) => {
      const store = getStore();

      const result = store.delete(path, { recursive, message });

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
            path,
            message: message || 'Resource deleted',
            currentTick: store.getCurrentTick(),
          }, null, 2),
        }],
      };
    }
  );
}