import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { projects, layers } from '../data/index.js';

export function registerGetProject(server: McpServer): void {
  server.tool(
    'get_project',
    'Get detailed information about a specific Arctic Workspace project including build commands and dependencies',
    {
      name: z.string().describe('Project name (e.g., coregfx, cryo-studio, cryo-studio-webapp)'),
    },
    async ({ name }) => {
      const project = projects.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );

      if (project) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                project,
                fullPath: `arctic/arctic-workspace/${project.path}`,
                tips: getTipsForProject(project.name),
              }, null, 2),
            },
          ],
        };
      }

      // Check if project exists in any layer (but without detailed info)
      for (const layer of layers) {
        if (layer.projects.includes(name)) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  project: {
                    name,
                    layer: layer.name,
                    path: `${layer.path}${name}/`,
                    technology: layer.technology.includes('CMake') ? 'cmake' : 'unknown',
                    note: 'Limited information available for this project',
                  },
                  fullPath: `arctic/arctic-workspace/${layer.path}${name}/`,
                }, null, 2),
              },
            ],
          };
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error: `Project "${name}" not found`,
              suggestion: 'Use list_projects() to see all available projects',
            }, null, 2),
          },
        ],
      };
    }
  );
}

function getTipsForProject(name: string): string[] {
  const tips: Record<string, string[]> = {
    coregfx: [
      'This is the foundation graphics library - all renderers depend on it',
      'Uses Vulkan 1.3.231.1',
      'Build foundation layer first before building dependent projects',
    ],
    'cryo-studio': [
      'Main HTTP/gRPC server for studio tools',
      'Default port: 52010',
      'Connects to web UI via REST API',
      'Use with cryo-studio-webapp for full studio experience',
    ],
    'cryo-studio-webapp': [
      'Angular 18 frontend for Cryo Studio',
      'Uses Firebase for auth',
      'Dev server: npx nx serve cryo-studio-webapp',
      'Runs on http://localhost:4200',
    ],
    'arctic-renderer': [
      'Main Vulkan PBR renderer executable',
      'Can run standalone or with HTTP API',
      'Screenshot API: curl http://localhost:52009/api/screenshot',
    ],
  };

  return tips[name] ?? [];
}
