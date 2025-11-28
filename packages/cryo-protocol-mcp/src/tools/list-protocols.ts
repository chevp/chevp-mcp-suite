import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadProtocolData, listProtoFiles } from '../data/loader.js';
import { protocolDomains, protocolStats } from '../data/index.js';

export function registerListProtocols(server: McpServer): void {
  server.tool(
    'list_protocols',
    'List all protocol domains in Arctic Workspace - reads from arctic-workspace/.mcp/protocols.json',
    {},
    async () => {
      const externalData = loadProtocolData();

      if (externalData) {
        const domainsWithCounts = externalData.domains.map((domain) => {
          const protoFiles = listProtoFiles(domain.path);
          return {
            name: domain.name,
            description: domain.description,
            path: domain.path,
            protoFileCount: protoFiles.length,
            categoryCount: domain.categories.length,
          };
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                source: 'arctic-workspace/.mcp/protocols.json',
                protocols: domainsWithCounts,
                stats: externalData.stats,
              }, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              source: 'static (fallback)',
              protocols: protocolDomains.map((p) => ({
                name: p.name,
                description: p.description,
              })),
              stats: protocolStats,
            }, null, 2),
          },
        ],
      };
    }
  );
}
