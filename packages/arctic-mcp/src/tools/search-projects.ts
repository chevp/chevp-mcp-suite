import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { projects, layers } from '../data/index.js';

export function registerSearchProjects(server: McpServer): void {
  server.tool(
    'search_projects',
    'Search for projects in Arctic Workspace by keyword (searches name, description, and technology)',
    {
      query: z.string().describe('Search query keyword'),
    },
    async ({ query }) => {
      const queryLower = query.toLowerCase();

      // Search in detailed projects
      const matchedProjects = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(queryLower) ||
          p.description.toLowerCase().includes(queryLower) ||
          p.technology.toLowerCase().includes(queryLower) ||
          p.layer.toLowerCase().includes(queryLower)
      );

      // Also search in layer project lists
      const additionalMatches: Array<{ name: string; layer: string }> = [];
      const matchedNames = new Set(matchedProjects.map((p) => p.name));

      for (const layer of layers) {
        for (const projectName of layer.projects) {
          if (
            !matchedNames.has(projectName) &&
            projectName.toLowerCase().includes(queryLower)
          ) {
            additionalMatches.push({ name: projectName, layer: layer.name });
          }
        }
      }

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
                projects: matchedProjects.map((p) => ({
                  name: p.name,
                  description: p.description,
                  layer: p.layer,
                  technology: p.technology,
                })),
                additionalProjects: additionalMatches,
                layers: matchedLayers.map((l) => ({
                  name: l.name,
                  description: l.description,
                })),
              },
              totalMatches:
                matchedProjects.length +
                additionalMatches.length +
                matchedLayers.length,
            }, null, 2),
          },
        ],
      };
    }
  );
}
