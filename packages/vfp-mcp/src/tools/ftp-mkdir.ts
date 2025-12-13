// =============================================================================
// VFP MCP - MKDIR Tool (FTP-like)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerMkdir(server: McpServer): void {
  server.tool(
    'vfp_mkdir',
    'Create a directory in the virtual file system (FTP MKD equivalent)',
    {
      path: z.string().describe('Directory path to create'),
    },
    async ({ path }) => {
      const store = getStore();

      const result = store.mkdir(path);

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
            message: `Directory created: ${path}`,
          }, null, 2),
        }],
      };
    }
  );
}