// =============================================================================
// VFP MCP - GET Tool (FTP-like)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerGet(server: McpServer): void {
  server.tool(
    'vfp_get',
    'Read a resource from the virtual file system (FTP GET equivalent)',
    {
      path: z.string().describe('Path to the resource (e.g., /scenes/level_01/nodes/player_01.state)'),
      atTick: z.number().optional().describe('Read at specific version tick (optional)'),
    },
    async ({ path, atTick }) => {
      const store = getStore();

      const atVersion = atTick ? {
        tick: atTick,
        branch: store.getCurrentBranch(),
        timestamp: Date.now(),
      } : undefined;

      const result = store.get(path, atVersion);

      if (!result) {
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

      // Try to parse as JSON for pretty display
      let dataContent: string;
      try {
        const jsonData = JSON.parse(result.data?.toString('utf-8') || '{}');
        dataContent = JSON.stringify(jsonData, null, 2);
      } catch {
        dataContent = result.data?.toString('utf-8') || '';
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'ok',
            path,
            version: result.version,
            meta: result.meta,
            size: result.data?.length || 0,
            data: dataContent,
          }, null, 2),
        }],
      };
    }
  );
}