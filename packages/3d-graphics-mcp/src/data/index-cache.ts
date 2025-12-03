import fs from 'node:fs';
import path from 'node:path';
import type {
  Asset,
  AssetIndex,
  AssetType,
  ScanStatus,
  PipelineDefinitions,
  ShaderDefinitions,
} from '../types/index.js';
import { getIndexPath, getPipelinesPath, getMcpDataPath } from './config.js';

// In-memory cache
let assetIndex: AssetIndex | null = null;
let scanStatus: ScanStatus | null = null;
let pipelineDefinitions: PipelineDefinitions | null = null;
let shaderDefinitions: ShaderDefinitions | null = null;

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Asset Index
export function loadAssetIndex(): AssetIndex {
  if (assetIndex) {
    return assetIndex;
  }

  const indexPath = path.join(getIndexPath(), 'assets.json');

  if (fs.existsSync(indexPath)) {
    try {
      const content = fs.readFileSync(indexPath, 'utf-8');
      assetIndex = JSON.parse(content) as AssetIndex;
      return assetIndex;
    } catch (error) {
      console.error('Failed to load asset index:', error);
    }
  }

  // Return empty index
  assetIndex = createEmptyIndex();
  return assetIndex;
}

export function saveAssetIndex(index: AssetIndex): void {
  const indexDir = getIndexPath();
  ensureDirectoryExists(indexDir);

  const indexPath = path.join(indexDir, 'assets.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  assetIndex = index;
}

export function createEmptyIndex(): AssetIndex {
  return {
    version: '1.0.0',
    generated: new Date().toISOString(),
    scan_duration_ms: 0,
    stats: {
      total: 0,
      by_type: {
        model: 0,
        texture: 0,
        material: 0,
        shader: 0,
        scene: 0,
        animation: 0,
        font: 0,
      },
    },
    assets: {},
  };
}

export function invalidateAssetIndex(): void {
  assetIndex = null;
}

// Scan Status
export function loadScanStatus(): ScanStatus {
  if (scanStatus) {
    return scanStatus;
  }

  const statusPath = path.join(getMcpDataPath(), 'last-scan.json');

  if (fs.existsSync(statusPath)) {
    try {
      const content = fs.readFileSync(statusPath, 'utf-8');
      scanStatus = JSON.parse(content) as ScanStatus;
      return scanStatus;
    } catch (error) {
      console.error('Failed to load scan status:', error);
    }
  }

  scanStatus = createEmptyScanStatus();
  return scanStatus;
}

export function saveScanStatus(status: ScanStatus): void {
  ensureDirectoryExists(getMcpDataPath());

  const statusPath = path.join(getMcpDataPath(), 'last-scan.json');
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
  scanStatus = status;
}

export function createEmptyScanStatus(): ScanStatus {
  return {
    last_full_scan: '',
    scan_duration_ms: 0,
    directories: {},
    incremental_scans: [],
  };
}

// Pipeline Definitions
export function loadPipelineDefinitions(): PipelineDefinitions {
  if (pipelineDefinitions) {
    return pipelineDefinitions;
  }

  const pipelinesPath = path.join(getPipelinesPath(), 'definitions.json');

  if (fs.existsSync(pipelinesPath)) {
    try {
      const content = fs.readFileSync(pipelinesPath, 'utf-8');
      pipelineDefinitions = JSON.parse(content) as PipelineDefinitions;
      return pipelineDefinitions;
    } catch (error) {
      console.error('Failed to load pipeline definitions:', error);
    }
  }

  pipelineDefinitions = getDefaultPipelineDefinitions();
  return pipelineDefinitions;
}

export function savePipelineDefinitions(definitions: PipelineDefinitions): void {
  const pipelinesDir = getPipelinesPath();
  ensureDirectoryExists(pipelinesDir);

  const pipelinesPath = path.join(pipelinesDir, 'definitions.json');
  fs.writeFileSync(pipelinesPath, JSON.stringify(definitions, null, 2));
  pipelineDefinitions = definitions;
}

function getDefaultPipelineDefinitions(): PipelineDefinitions {
  return {
    version: '1.0.0',
    pipelines: {
      'blend-to-gltf': {
        id: 'blend-to-gltf',
        name: 'Blender to glTF',
        description: 'Export Blender files to glTF 2.0 format',
        input_formats: ['.blend'],
        output_format: '.gltf',
        steps: [
          {
            tool: 'blender',
            action: 'export_gltf',
            args: {
              export_format: 'GLTF_SEPARATE',
              export_textures: true,
            },
          },
        ],
        options: {
          draco_compression: { type: 'boolean', default: false },
          embed_textures: { type: 'boolean', default: false },
        },
      },
      'texture-to-ktx2': {
        id: 'texture-to-ktx2',
        name: 'Texture to KTX2',
        description: 'Convert textures to GPU-compressed KTX2',
        input_formats: ['.png', '.jpg', '.exr', '.tga'],
        output_format: '.ktx2',
        steps: [
          {
            tool: 'toktx',
            args: ['--genmipmap', '--bcmp'],
          },
        ],
        options: {
          generate_mipmaps: { type: 'boolean', default: true },
          compression: { type: 'enum', values: ['bc7', 'etc2', 'astc'], default: 'bc7' },
        },
      },
    },
    tools: {
      blender: {
        executable: 'blender',
        version_required: '>=3.6',
        scripts_path: '.mcp/scripts/blender/',
      },
      toktx: {
        executable: 'toktx',
        version_required: '>=4.0',
      },
      'gltf-transform': {
        executable: 'npx',
        args: ['@gltf-transform/cli'],
      },
    },
  };
}

// Shader Definitions
export function loadShaderDefinitions(): ShaderDefinitions {
  if (shaderDefinitions) {
    return shaderDefinitions;
  }

  const shaderPath = path.join(getIndexPath(), 'shaders.json');

  if (fs.existsSync(shaderPath)) {
    try {
      const content = fs.readFileSync(shaderPath, 'utf-8');
      shaderDefinitions = JSON.parse(content) as ShaderDefinitions;
      return shaderDefinitions;
    } catch (error) {
      console.error('Failed to load shader definitions:', error);
    }
  }

  shaderDefinitions = getDefaultShaderDefinitions();
  return shaderDefinitions;
}

function getDefaultShaderDefinitions(): ShaderDefinitions {
  return {
    version: '1.0.0',
    shader_profiles: {
      pbr: {
        id: 'pbr',
        name: 'PBR (Khronos)',
        description: 'Physically Based Rendering - Standard',
        target: 'vkpbr5/shaders/pbr_khr.frag',
        required_maps: ['baseColor', 'normal', 'metallicRoughness'],
        optional_maps: ['occlusion', 'emissive'],
        material_properties: ['baseColorFactor', 'metallicFactor', 'roughnessFactor'],
      },
      toon: {
        id: 'toon',
        name: 'Toon/Cel Shading',
        description: 'Stylized cel-shaded rendering',
        target: 'vkpbr5/shaders/toon.frag',
        required_maps: ['baseColor'],
        optional_maps: ['normal', 'ramp'],
      },
      unlit: {
        id: 'unlit',
        name: 'Unlit',
        description: 'No lighting calculations',
        target: 'vkpbr5/shaders/unlit.frag',
        required_maps: ['baseColor'],
        optional_maps: [],
      },
    },
    compatibility_matrix: {},
  };
}

// Utility functions
export function getAssetById(id: string): Asset | undefined {
  const index = loadAssetIndex();
  return index.assets[id];
}

export function getAssetsByType(type: AssetType): Asset[] {
  const index = loadAssetIndex();
  return Object.values(index.assets).filter((asset) => asset.type === type);
}

export function getAssetsByCategory(category: string): Asset[] {
  const index = loadAssetIndex();
  return Object.values(index.assets).filter((asset) => asset.category === category);
}

export function getAllAssets(): Asset[] {
  const index = loadAssetIndex();
  return Object.values(index.assets);
}

export function getIndexStats(): AssetIndex['stats'] {
  const index = loadAssetIndex();
  return index.stats;
}

export function isCacheValid(): boolean {
  const status = loadScanStatus();
  if (!status.last_full_scan) {
    return false;
  }

  // Cache is valid for 24 hours
  const lastScan = new Date(status.last_full_scan);
  const now = new Date();
  const hoursSinceLastScan = (now.getTime() - lastScan.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastScan < 24;
}
