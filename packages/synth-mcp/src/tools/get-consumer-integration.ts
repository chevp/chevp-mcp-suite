import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getConsumerIntegration } from '../data/consumer-integration.js';

export function registerGetConsumerIntegration(server: McpServer): void {
  server.tool(
    'get_consumer_integration',
    'Get integration guide for C++ Vulkan consumers or other clients connecting to synth-core-hub',
    {
      approach: z
        .enum(['all', 'rest', 'grpc', 'websocket'])
        .optional()
        .describe('Which integration approach to show'),
    },
    async ({ approach }) => {
      const result = getConsumerIntegration(approach || 'all');

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}