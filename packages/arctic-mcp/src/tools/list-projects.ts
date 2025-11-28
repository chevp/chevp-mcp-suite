import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { layers, projects } from '../data/index.js';

export function registerListProjects(server: McpServer): void {
  server.tool(
    'list_projects',
    'List all projects in Arctic Workspace, optionally filtered by layer or technology',
    {
      layer: z.string().optional().describe('Filter by layer (foundation, domain, apps, agents, java, web)'),
      technology: z.string().optional().describe('Filter by technology (cmake, maven, npm, nx)'),
    },
    async ({ layer, technology }) => {
      let filteredProjects = projects;

      if (layer) {
        filteredProjects = filteredProjects.filter(
          (p) => p.layer.toLowerCase() === layer.toLowerCase()
        );
      }

      if (technology) {
        filteredProjects = filteredProjects.filter(
          (p) => p.technology.toLowerCase() === technology.toLowerCase()
        );
      }

      // Also include projects from layers that don't have detailed entries
      const allProjectNames = new Set(projects.map((p) => p.name));
      const additionalProjects: Array<{ name: string; layer: string }> = [];

      for (const l of layers) {
        if (!layer || l.name.toLowerCase() === layer.toLowerCase()) {
          for (const projectName of l.projects) {
            if (!allProjectNames.has(projectName)) {
              additionalProjects.push({ name: projectName, layer: l.name });
            }
          }
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              filters: { layer, technology },
              detailedProjects: filteredProjects.map((p) => ({
                name: p.name,
                description: p.description,
                layer: p.layer,
                technology: p.technology,
                type: p.type,
              })),
              additionalProjects,
              totalCount: filteredProjects.length + additionalProjects.length,
              usage: 'Use get_project(name) for detailed project information',
            }, null, 2),
          },
        ],
      };
    }
  );
}
