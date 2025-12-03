import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getAssetById, loadShaderDefinitions } from '../data/index-cache.js';

export function registerGetShaderCompatibility(server: McpServer): void {
  server.tool(
    'get_shader_compatibility',
    'Check which shaders are compatible with a specific asset',
    {
      asset_id: z.string().describe('Asset ID to check compatibility for'),
    },
    async ({ asset_id }) => {
      const asset = getAssetById(asset_id);

      if (!asset) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: `Asset not found: ${asset_id}`,
                suggestion: 'Use search_assets to find the correct asset ID',
              }, null, 2),
            },
          ],
        };
      }

      const shaderDefs = loadShaderDefinitions();

      // Get compatible shaders from asset
      const compatible = asset.shader_compatible.map((shaderId) => {
        const shader = shaderDefs.shader_profiles[shaderId];
        if (!shader) {
          return { id: shaderId, status: 'unknown' };
        }

        // Check if asset has required maps
        const assetTextures = asset.metadata.textures || [];
        const hasRequiredMaps = shader.required_maps.every((map) =>
          assetTextures.some((t) => t.toLowerCase().includes(map.toLowerCase()))
        );

        const missingMaps = shader.required_maps.filter((map) =>
          !assetTextures.some((t) => t.toLowerCase().includes(map.toLowerCase()))
        );

        return {
          id: shaderId,
          name: shader.name,
          description: shader.description,
          target: shader.target,
          status: hasRequiredMaps ? 'fully_compatible' : 'partial',
          required_maps: shader.required_maps,
          optional_maps: shader.optional_maps,
          missing_maps: missingMaps.length > 0 ? missingMaps : undefined,
        };
      });

      // Check all shaders for potential compatibility
      const allShaders = Object.values(shaderDefs.shader_profiles);
      const incompatible = allShaders
        .filter((s) => !asset.shader_compatible.includes(s.id))
        .map((s) => ({
          id: s.id,
          name: s.name,
          reason: 'Not listed as compatible',
          required_maps: s.required_maps,
        }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              asset: {
                id: asset.id,
                name: asset.name,
                type: asset.type,
                textures: asset.metadata.textures || [],
                materials: asset.metadata.materials || [],
              },
              compatible_shaders: compatible,
              incompatible_shaders: incompatible,
              recommendation: compatible.find((s) => s.status === 'fully_compatible')?.id || compatible[0]?.id,
            }, null, 2),
          },
        ],
      };
    }
  );
}
