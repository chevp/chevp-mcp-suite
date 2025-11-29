/**
 * Tool: list_modules
 * Lists all modules in the coregfx graphics library
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { modules, architectureStats } from '../data/index.js';
import { loadExternalData, isCoregfxAvailable } from '../data/loader.js';

export function registerListModules(server: McpServer): void {
  server.tool(
    'list_modules',
    'List all modules in the coregfx graphics foundation library with their status and dependencies',
    {},
    async () => {
      const externalData = loadExternalData();
      const codebaseAvailable = isCoregfxAvailable();

      const moduleList = modules.map((mod) => ({
        name: mod.name,
        description: mod.description,
        status: mod.status,
        path: mod.path,
        classCount: mod.classes.length,
        dependencies: mod.dependencies,
      }));

      const result = {
        codebaseAvailable,
        stats: {
          totalModules: architectureStats.totalModules,
          totalClasses: architectureStats.totalClasses,
          totalProtoFiles: architectureStats.totalProtoFiles,
          vulkanVersion: architectureStats.vulkanVersion,
          buildSystem: architectureStats.buildSystem,
          cppStandard: architectureStats.cppStandard,
        },
        modules: moduleList,
        externalModulesDetected: externalData?.modules ?? [],
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
