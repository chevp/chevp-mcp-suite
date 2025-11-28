import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getLayers, getWorkspaceStats } from '../data/loader.js';

export function registerListLayers(server: McpServer): void {
  server.tool(
    'list_layers',
    'List all 6 layers of the Arctic Workspace architecture (Foundation, Domain, Apps, Agents, Java, Web)',
    {},
    async () => {
      const layers = getLayers();
      const workspaceStats = getWorkspaceStats();

      const layerSummary = layers.map((layer) => ({
        name: layer.name,
        description: layer.description,
        technology: layer.technology,
        projectCount: layer.projects.length,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              layers: layerSummary,
              stats: workspaceStats,
              usage: 'Use get_layer(name) for detailed layer information',
            }, null, 2),
          },
        ],
      };
    }
  );
}
