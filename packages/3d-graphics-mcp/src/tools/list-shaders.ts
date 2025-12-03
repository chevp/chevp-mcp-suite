import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { loadShaderDefinitions } from '../data/index-cache.js';

export function registerListShaders(server: McpServer): void {
  server.tool(
    'list_shaders',
    'List available shader profiles for PBR rendering',
    {
      type: z.string().optional()
        .describe('Filter by shader type'),
    },
    async ({ type }) => {
      const definitions = loadShaderDefinitions();
      let shaders = Object.values(definitions.shader_profiles);

      if (type) {
        shaders = shaders.filter((s) =>
          s.id.includes(type) || s.name.toLowerCase().includes(type.toLowerCase())
        );
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              shader_profiles: shaders.map((s) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                target: s.target,
                required_maps: s.required_maps,
                optional_maps: s.optional_maps,
              })),
              usage: 'Use get_shader_compatibility(asset_id) to check which shaders work with an asset',
            }, null, 2),
          },
        ],
      };
    }
  );
}
