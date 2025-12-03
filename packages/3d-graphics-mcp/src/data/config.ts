import path from 'node:path';
import type { Config } from '../types/index.js';

// Default configuration
const DEFAULT_CONFIG: Config = {
  version: '1.0.0',
  graphics_root: 'C:/chevp/3d-graphics',
  deployment_target: 'C:/chevp/arctic/arctic-workspace/assets/vkpbr5',
  scan_patterns: {
    include: ['**/*'],
    exclude: [
      '**/node_modules/**',
      '**/.git/**',
      '**/build/**',
      '**/dist/**',
      '**/*.tmp',
      '**/*.bak',
    ],
  },
  supported_formats: {
    models: ['.blend', '.gltf', '.glb', '.fbx', '.obj', '.dae'],
    textures: ['.png', '.jpg', '.jpeg', '.exr', '.hdr', '.tga', '.ktx', '.ktx2'],
    shaders: ['.vert', '.frag', '.glsl', '.spv'],
  },
};

let cachedConfig: Config | null = null;

export function getGraphicsRoot(): string {
  return process.env.GRAPHICS_ROOT || DEFAULT_CONFIG.graphics_root;
}

export function getDeploymentTarget(): string {
  return process.env.DEPLOYMENT_TARGET || DEFAULT_CONFIG.deployment_target;
}

export function getMcpDataPath(): string {
  return path.join(getGraphicsRoot(), '.mcp');
}

export function getIndexPath(): string {
  return path.join(getMcpDataPath(), 'index');
}

export function getCachePath(): string {
  return path.join(getMcpDataPath(), 'cache');
}

export function getPipelinesPath(): string {
  return path.join(getMcpDataPath(), 'pipelines');
}

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  // For now, return default config
  // Later: load from .mcp/config.json
  cachedConfig = DEFAULT_CONFIG;
  return cachedConfig;
}

export function getSupportedFormats(): Config['supported_formats'] {
  return getConfig().supported_formats;
}

export function isModelFormat(ext: string): boolean {
  return getSupportedFormats().models.includes(ext.toLowerCase());
}

export function isTextureFormat(ext: string): boolean {
  return getSupportedFormats().textures.includes(ext.toLowerCase());
}

export function isShaderFormat(ext: string): boolean {
  return getSupportedFormats().shaders.includes(ext.toLowerCase());
}
