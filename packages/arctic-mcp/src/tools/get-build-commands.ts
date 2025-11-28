import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildCommands, projects } from '../data/index.js';

export function registerGetBuildCommands(server: McpServer): void {
  server.tool(
    'get_build_commands',
    'Get build commands for Arctic Workspace - either all common commands or for a specific project',
    {
      project: z.string().optional().describe('Optional project name to get specific build command'),
    },
    async ({ project }) => {
      if (project) {
        const proj = projects.find(
          (p) => p.name.toLowerCase() === project.toLowerCase()
        );

        if (proj?.buildCommand) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  project: proj.name,
                  buildCommand: proj.buildCommand,
                  workingDir: `arctic/arctic-workspace/${proj.path}`,
                  dependencies: proj.dependencies,
                  note: 'Run from arctic-workspace root or adjust paths accordingly',
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
                error: `No build command found for project "${project}"`,
                suggestion: 'Use list_projects() to see available projects with build commands',
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
              commonBuildCommands: buildCommands,
              note: 'All commands should be run from c:/chevp/',
              quickStart: {
                fullBuild: 'cd arctic/arctic-workspace && cmake -B build -DCMAKE_TOOLCHAIN_FILE=C:\\vcpkg\\scripts\\buildsystems\\vcpkg.cmake && cmake --build build --config Release',
                webOnly: 'cd arctic/arctic-workspace/web && npm install && npx nx run-many -t build',
              },
            }, null, 2),
          },
        ],
      };
    }
  );
}
