/**
 * Tool: get_module
 * Get detailed information about a specific coregfx module
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { modules, classes, dataFlows } from '../data/index.js';
import { readHeaderFile, isCoregfxAvailable } from '../data/loader.js';

export function registerGetModule(server: McpServer): void {
  server.tool(
    'get_module',
    'Get detailed information about a specific coregfx module including its classes, header files, and usage patterns',
    {
      name: z
        .string()
        .describe(
          'The module name (e.g., "core", "gltf", "pbr", "rsc", "platform")'
        ),
      include_headers: z
        .boolean()
        .optional()
        .describe('Include header file contents if available (default: false)'),
    },
    async ({ name, include_headers }) => {
      const module = modules.find(
        (m) => m.name.toLowerCase() === name.toLowerCase()
      );

      if (!module) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  error: `Module '${name}' not found`,
                  availableModules: modules.map((m) => m.name),
                  hint: 'Use list_modules to see all available modules',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const moduleClasses = classes.filter((c) => c.module === module.name);

      const relatedFlows = dataFlows.filter((flow) =>
        flow.steps.some((step) =>
          moduleClasses.some((c) => step.component.includes(c.name))
        )
      );

      let headerContents: Record<string, string> | undefined;
      if (include_headers && isCoregfxAvailable()) {
        headerContents = {};
        for (const header of module.headerFiles.slice(0, 3)) {
          // Limit to first 3
          const content = readHeaderFile(`coregfx/${module.name}/${header}`);
          if (content) {
            // Truncate long files
            headerContents[header] =
              content.length > 5000
                ? content.substring(0, 5000) + '\n... (truncated)'
                : content;
          }
        }
      }

      const result = {
        module: {
          name: module.name,
          description: module.description,
          path: module.path,
          status: module.status,
          dependencies: module.dependencies,
          headerFiles: module.headerFiles,
        },
        classes: moduleClasses.map((c) => ({
          name: c.name,
          description: c.description,
          headerFile: c.headerFile,
          pattern: c.pattern,
          methodCount: c.publicMethods.length,
        })),
        relatedDataFlows: relatedFlows.map((f) => ({
          name: f.name,
          description: f.description,
        })),
        headerContents,
        codebaseAvailable: isCoregfxAvailable(),
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
