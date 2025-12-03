import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getAssetById, loadShaderDefinitions } from '../data/index-cache.js';

export function registerGetAsset(server: McpServer): void {
  server.tool(
    'get_asset',
    'Get detailed information about a specific 3D graphics asset',
    {
      id: z.string().describe('Asset ID (e.g., model:damaged-helmet)'),
    },
    async ({ id }) => {
      const asset = getAssetById(id);

      if (!asset) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: `Asset not found: ${id}`,
                suggestion: 'Use list_assets or search_assets to find available assets',
              }, null, 2),
            },
          ],
        };
      }

      // Get shader compatibility details
      const shaderDefs = loadShaderDefinitions();
      const compatibleShaders = asset.shader_compatible.map((shaderId) => {
        const shader = shaderDefs.shader_profiles[shaderId];
        return shader ? {
          id: shaderId,
          name: shader.name,
          description: shader.description,
          required_maps: shader.required_maps,
        } : { id: shaderId };
      });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              asset: {
                ...asset,
                shader_details: compatibleShaders,
              },
              usage: {
                prepare_deployment: `Use prepare_deployment(["${id}"]) to prepare for vkpbr5`,
                run_pipeline: `Use run_pipeline("blend-to-gltf", "${asset.path}") to convert`,
              },
            }, null, 2),
          },
        ],
      };
    }
  );
}
