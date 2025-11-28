import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { protocolDomains, keyMessages, keyServices } from '../data/index.js';

export function registerGetProtocol(server: McpServer): void {
  server.tool(
    'get_protocol',
    'Get detailed information about a specific protocol domain including proto files and key messages',
    {
      name: z.string().describe('Protocol domain name (e.g., cryo-protocol, arctic-protocol, coregfx-protocol)'),
    },
    async ({ name }) => {
      const protocol = protocolDomains.find(
        (p) => p.name.toLowerCase() === name.toLowerCase() ||
               p.name.toLowerCase().replace('-protocol', '') === name.toLowerCase()
      );

      if (!protocol) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: `Protocol "${name}" not found`,
                availableProtocols: protocolDomains.map((p) => p.name),
              }, null, 2),
            },
          ],
        };
      }

      const domainMessages = keyMessages.filter((m) => m.domain === protocol.name);
      const domainServices = keyServices.filter((s) => s.domain === protocol.name);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              protocol: {
                name: protocol.name,
                description: protocol.description,
                protoFiles: protocol.protoFiles,
                messageCount: protocol.messageCount,
                serviceCount: protocol.serviceCount,
              },
              keyMessages: domainMessages,
              keyServices: domainServices.map((s) => ({
                name: s.name,
                description: s.description,
                methodCount: s.methods.length,
              })),
              protoPath: `arctic/arctic-workspace/foundation/${protocol.name}/`,
            }, null, 2),
          },
        ],
      };
    }
  );
}
