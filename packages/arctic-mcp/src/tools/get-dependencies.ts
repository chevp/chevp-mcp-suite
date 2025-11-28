import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { projects, layers } from '../data/index.js';

export function registerGetDependencies(server: McpServer): void {
  server.tool(
    'get_dependencies',
    'Get dependency graph for a project or layer in Arctic Workspace',
    {
      name: z.string().describe('Project or layer name'),
    },
    async ({ name }) => {
      // Check if it's a layer
      const layer = layers.find((l) => l.name.toLowerCase() === name.toLowerCase());
      if (layer) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                type: 'layer',
                name: layer.name,
                layerDependencies: getLayerDependencies(layer.name),
                note: 'Layer dependencies show the build order',
              }, null, 2),
            },
          ],
        };
      }

      // Check if it's a project
      const project = projects.find(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );

      if (project) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                type: 'project',
                name: project.name,
                layer: project.layer,
                dependencies: project.dependencies ?? [],
                dependencyTree: buildDependencyTree(project.name),
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
              error: `"${name}" not found as project or layer`,
              availableLayers: layers.map((l) => l.name),
              suggestion: 'Use list_projects() or list_layers() to see available options',
            }, null, 2),
          },
        ],
      };
    }
  );
}

function getLayerDependencies(layerName: string): string[] {
  const dependencyOrder: Record<string, string[]> = {
    foundation: [],
    domain: ['foundation'],
    apps: ['foundation', 'domain'],
    agents: ['foundation', 'domain', 'apps'],
    java: [],
    web: ['agents'],
  };

  return dependencyOrder[layerName] ?? [];
}

function buildDependencyTree(projectName: string): Record<string, string[]> {
  const tree: Record<string, string[]> = {};
  const project = projects.find((p) => p.name === projectName);

  if (project?.dependencies) {
    tree[projectName] = project.dependencies;

    // Add known internal dependencies
    for (const dep of project.dependencies) {
      const depProject = projects.find((p) => p.name === dep);
      if (depProject?.dependencies) {
        tree[dep] = depProject.dependencies;
      }
    }
  }

  return tree;
}
