// =============================================================================
// VFP MCP - STAT Tool (FTP-like)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerStat(server: McpServer): void {
  server.tool(
    'vfp_stat',
    'Get metadata about a resource (FTP STAT equivalent)',
    {
      path: z.string().describe('Path to the resource'),
    },
    async ({ path }) => {
      const store = getStore();

      const entry = store.stat(path);

      if (!entry) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              status: 'not_found',
              error: `Resource not found: ${path}`,
            }, null, 2),
          }],
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'ok',
            path: entry.path,
            name: entry.name,
            type: entry.type,
            size: entry.size,
            modified: new Date(entry.modified).toISOString(),
            version: entry.version,
            meta: entry.meta,
          }, null, 2),
        }],
      };
    }
  );
}