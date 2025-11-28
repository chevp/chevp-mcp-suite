import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getLayers, searchProjects } from '../data/loader.js';

export function registerSearchProjects(server: McpServer): void {
  server.tool(
    'search_projects',
    'Search for projects in Arctic Workspace by keyword (searches name and layer)',
    {
      query: z.string().describe('Search query keyword'),
    },
    async ({ query }) => {
      const queryLower = query.toLowerCase();
      const layers = getLayers();

      // Search projects across layers
      const matchedProjects = searchProjects(query);

      // Search in layers themselves
      const matchedLayers = layers.filter(
        (l) =>
          l.name.toLowerCase().includes(queryLower) ||
          l.description.toLowerCase().includes(queryLower) ||
          l.technology.toLowerCase().includes(queryLower)
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              query,
              results: {
                projects: matchedProjects,
                layers: matchedLayers.map((l) => ({
                  name: l.name,
                  description: l.description,
                })),
              },
              totalMatches: matchedProjects.length + matchedLayers.length,
            }, null, 2),
          },
        ],
      };
    }
  );
}
