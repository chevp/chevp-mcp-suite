import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getModule, getAllModules } from '../data/modules.js';

export function registerGetModuleExamples(server: McpServer): void {
  server.tool(
    'get_module_examples',
    'Get usage examples for a specific Nuna SDK module',
    {
      name: z.string().describe('Module name, e.g., nuna-core'),
    },
    async ({ name }) => {
      const mod = getModule(name);

      if (!mod) {
        const available = getAllModules()
          .map((m) => m.name)
          .join(', ');
        return {
          content: [
            {
              type: 'text' as const,
              text: `Module "${name}" not found. Available modules: ${available}`,
            },
          ],
          isError: true,
        };
      }

      if (!mod.examples || mod.examples.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No examples available for module "${name}"`,
            },
          ],
        };
      }

      const examplesText = mod.examples
        .map((ex, i) => `// Example ${i + 1}\n${ex}`)
        .join('\n\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: `# ${mod.name} - Usage Examples\n\n${examplesText}`,
          },
        ],
      };
    }
  );
}
