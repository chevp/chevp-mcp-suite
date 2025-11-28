import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getLayers, getLayerByName } from '../data/loader.js';

export function registerGetLayer(server: McpServer): void {
  server.tool(
    'get_layer',
    'Get detailed information about a specific Arctic Workspace layer including all projects',
    {
      name: z.string().describe('Layer name: foundation, domain, apps, agents, java, or web'),
    },
    async ({ name }) => {
      const layer = getLayerByName(name);

      if (!layer) {
        const layers = getLayers();
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: `Layer "${name}" not found`,
                availableLayers: layers.map((l) => l.name),
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
              layer: {
                name: layer.name,
                description: layer.description,
                technology: layer.technology,
                path: layer.path,
                dependsOn: layer.dependsOn,
              },
              projects: layer.projects,
              usage: 'Use get_project(name) for specific project details',
            }, null, 2),
          },
        ],
      };
    }
  );
}
