import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { getAssetById } from '../data/index-cache.js';
import { getDeploymentTarget } from '../data/config.js';

interface ManifestAsset {
  id: string;
  path: string;
  type: string;
  description: string;
  size?: number;
  vertex?: string;
  fragment?: string;
}

interface Manifest {
  name: string;
  version: string;
  description: string;
  assets: {
    environments: ManifestAsset[];
    models: ManifestAsset[];
    textures: ManifestAsset[];
    fonts: ManifestAsset[];
    shaders: ManifestAsset[];
  };
  metadata: {
    created: string;
    author: string;
    license: string;
    pak_compatible: boolean;
    pak_filename: string;
  };
}

function loadManifest(targetPath: string): Manifest | null {
  const manifestPath = path.join(targetPath, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Manifest;
    } catch {
      return null;
    }
  }
  return null;
}

function saveManifest(targetPath: string, manifest: Manifest): void {
  const manifestPath = path.join(targetPath, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

export function registerDeployToVkpbr5(server: McpServer): void {
  server.tool(
    'deploy_to_vkpbr5',
    'Deploy assets to the vkpbr5 asset pack for Arctic Engine',
    {
      asset_ids: z.array(z.string()).describe('Asset IDs to deploy'),
      update_manifest: z.boolean().optional().default(true)
        .describe('Update manifest.json with new assets'),
      dry_run: z.boolean().optional().default(false)
        .describe('Preview deployment without making changes'),
    },
    async ({ asset_ids, update_manifest, dry_run }) => {
      const targetPath = getDeploymentTarget();

      // Validate target exists
      if (!fs.existsSync(targetPath)) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: `Deployment target not found: ${targetPath}`,
                suggestion: 'Ensure arctic-workspace/assets/vkpbr5 exists',
              }, null, 2),
            },
          ],
        };
      }

      // Load existing manifest
      const manifest = loadManifest(targetPath);
      if (!manifest) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: 'Could not load manifest.json from deployment target',
                target: targetPath,
              }, null, 2),
            },
          ],
        };
      }

      const results: Array<{
        asset_id: string;
        status: 'success' | 'error' | 'skipped';
        message: string;
        target_path?: string;
      }> = [];

      for (const assetId of asset_ids) {
        const asset = getAssetById(assetId);

        if (!asset) {
          results.push({
            asset_id: assetId,
            status: 'error',
            message: 'Asset not found in index',
          });
          continue;
        }

        // Determine target category in manifest
        let category: keyof Manifest['assets'];
        switch (asset.type) {
          case 'model':
            category = 'models';
            break;
          case 'texture':
            category = 'textures';
            break;
          case 'shader':
            category = 'shaders';
            break;
          case 'font':
            category = 'fonts';
            break;
          default:
            results.push({
              asset_id: assetId,
              status: 'skipped',
              message: `Asset type ${asset.type} not supported for deployment`,
            });
            continue;
        }

        // Check if asset has deployable format
        const deployableFormats = ['.gltf', '.glb', '.ktx', '.ktx2', '.ttf', '.otf', '.vert', '.frag'];
        const hasDeployableFormat = asset.formats.some((f) => deployableFormats.includes(f));

        if (!hasDeployableFormat) {
          results.push({
            asset_id: assetId,
            status: 'error',
            message: `Asset needs conversion first. Available formats: ${asset.formats.join(', ')}`,
          });
          continue;
        }

        // Determine target path
        const targetDir = path.join(targetPath, category, asset.name);
        const relativePath = `${category}/${asset.name}`;

        if (dry_run) {
          results.push({
            asset_id: assetId,
            status: 'success',
            message: 'Would deploy (dry run)',
            target_path: relativePath,
          });
        } else {
          // Would copy files here
          results.push({
            asset_id: assetId,
            status: 'success',
            message: 'Deployment prepared (copy files manually or use pipeline)',
            target_path: relativePath,
          });
        }

        // Update manifest if requested
        if (update_manifest && !dry_run) {
          const existingIndex = manifest.assets[category].findIndex((a) => a.id === asset.name);
          const manifestEntry: ManifestAsset = {
            id: asset.name,
            path: relativePath,
            type: asset.formats.find((f) => deployableFormats.includes(f)) || asset.formats[0],
            description: asset.name,
          };

          if (existingIndex >= 0) {
            manifest.assets[category][existingIndex] = manifestEntry;
          } else {
            manifest.assets[category].push(manifestEntry);
          }
        }
      }

      // Save updated manifest
      if (update_manifest && !dry_run) {
        saveManifest(targetPath, manifest);
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              deployment_target: targetPath,
              dry_run,
              results,
              manifest_updated: update_manifest && !dry_run,
              summary: {
                total: results.length,
                success: results.filter((r) => r.status === 'success').length,
                errors: results.filter((r) => r.status === 'error').length,
                skipped: results.filter((r) => r.status === 'skipped').length,
              },
            }, null, 2),
          },
        ],
      };
    }
  );
}
