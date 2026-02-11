import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getService, HUB_SERVICES } from '../data/hub-services.js';

export function registerGetProtoService(server: McpServer): void {
  server.tool(
    'get_proto_service',
    'Get detailed information about a specific gRPC/REST service including all RPCs',
    {
      name: z.string().describe('Service name (e.g., "NodeRegistryService", "SynthRestApi")'),
    },
    async ({ name }) => {
      const service = getService(name);

      if (!service) {
        const available = HUB_SERVICES.map((s) => s.name).join(', ');
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ error: `Service not found. Available: ${available}` }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(service, null, 2),
          },
        ],
      };
    }
  );
}