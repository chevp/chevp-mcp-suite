import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { layers, projects } from '../data/index.js';

export function registerGetLayer(server: McpServer): void {
  server.tool(
    'get_layer',
    'Get detailed information about a specific Arctic Workspace layer including all projects',
    {
      name: z.string().describe('Layer name: foundation, domain, apps, agents, java, or web'),
    },
    async ({ name }) => {
      const layer = layers.find((l) => l.name.toLowerCase() === name.toLowerCase());

      if (!layer) {
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

      // Get detailed project info for this layer
      const layerProjects = projects.filter((p) => p.layer === layer.name);

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
              },
              projects: layer.projects,
              detailedProjects: layerProjects,
              usage: 'Use get_project(name) for specific project details',
            }, null, 2),
          },
        ],
      };
    }
  );
}
