// =============================================================================
// VFP MCP - INPUT Tool (Realtime)
// =============================================================================

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getStore } from '../data/store.js';

export function registerInput(server: McpServer): void {
  server.tool(
    'vfp_input',
    'Send user input for a node (Realtime client → server)',
    {
      nodeId: z.string().describe('Target node ID'),
      field: z.string().describe('Field to update (e.g., "transform.position")'),
      value: z.unknown().describe('New value'),
      sequence: z.number().describe('Client sequence number for ordering'),
    },
    async ({ nodeId, field, value, sequence }) => {
      const store = getStore();

      const result = store.input(nodeId, field, value, sequence);

      if (!result.accepted) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              status: 'rejected',
              correction: result.correction,
              message: 'Input rejected by server',
            }, null, 2),
          }],
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            status: 'accepted',
            nodeId,
            field,
            sequence,
            currentTick: store.getCurrentTick(),
            message: `Input accepted seq:${sequence}`,
          }, null, 2),
        }],
      };
    }
  );
}