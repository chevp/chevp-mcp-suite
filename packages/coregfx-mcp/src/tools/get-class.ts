/**
 * Tool: get_class
 * Get detailed information about a specific coregfx class
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { classes, modules, cryoRelationships } from '../data/index.js';
import { readHeaderFile, isCoregfxAvailable } from '../data/loader.js';

export function registerGetClass(server: McpServer): void {
  server.tool(
    'get_class',
    'Get detailed information about a specific coregfx class including its public methods, patterns, and relationships',
    {
      name: z
        .string()
        .describe(
          'The class name (e.g., "VulkanContext", "GltfLoader", "AssetResolver")'
        ),
      include_source: z
        .boolean()
        .optional()
        .describe('Include source header content if available (default: false)'),
    },
    async ({ name, include_source }) => {
      const cls = classes.find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );

      if (!cls) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  error: `Class '${name}' not found`,
                  availableClasses: classes.map((c) => ({
                    name: c.name,
                    module: c.module,
                  })),
                  hint: 'Use list_modules or get_module to find available classes',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const module = modules.find((m) => m.name === cls.module);

      const relatedClasses = cls.relatedClasses
        ? classes.filter((c) => cls.relatedClasses?.includes(c.name))
        : [];

      const cryoRelations = cryoRelationships.filter(
        (rel) =>
          rel.coregfxComponent.toLowerCase() === cls.name.toLowerCase() ||
          rel.coregfxComponent.includes(cls.name)
      );

      let headerContent: string | undefined;
      if (include_source && isCoregfxAvailable() && module) {
        headerContent =
          readHeaderFile(`coregfx/${module.name}/${cls.headerFile}`) ?? undefined;
        if (headerContent && headerContent.length > 10000) {
          headerContent = headerContent.substring(0, 10000) + '\n... (truncated)';
        }
      }

      const result = {
        class: {
          name: cls.name,
          module: cls.module,
          description: cls.description,
          headerFile: cls.headerFile,
          pattern: cls.pattern,
        },
        publicMethods: cls.publicMethods,
        relatedClasses: relatedClasses.map((c) => ({
          name: c.name,
          module: c.module,
          description: c.description,
        })),
        cryoProtocolRelationships: cryoRelations,
        moduleInfo: module
          ? {
              name: module.name,
              path: module.path,
              status: module.status,
            }
          : null,
        headerContent,
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
