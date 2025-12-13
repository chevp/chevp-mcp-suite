// =============================================================================
// VFP MCP - PUT Tool (FTP-like)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerPut(server: McpServer): void {
  server.tool(
    'vfp_put',
    'Write a resource to the virtual file system (FTP PUT equivalent)',
    {
      path: z.string().describe('Path for the resource (e.g., /scenes/level_01/nodes/treasure.state)'),
      data: z.string().describe('Content to write (JSON string for state files)'),
      contentType: z.string().optional().describe('MIME type (default: application/json)'),
      message: z.string().optional().describe('Commit message for this change'),
      expectedTick: z.number().optional().describe('Expected version tick for optimistic locking'),
    },
    async ({ path, data, contentType, message, expectedTick }) => {
      const store = getStore();

      const expectedVersion = expectedTick ? {
        tick: expectedTick,
        branch: store.getCurrentBranch(),
        timestamp: Date.now(),
      } : undefined;

      const result = store.put(
        path,
        Buffer.from(data, 'utf-8'),
        {
          contentType: contentType || 'application/json',
          message,
          expectedVersion,
        }
      );

      if (!result.success) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              status: 'conflict',
              error: result.error,
              currentVersion: result.version,
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
            version: result.version,
            message: message || 'Resource updated',
            size: data.length,
          }, null, 2),
        }],
      };
    }
  );
}