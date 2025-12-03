import fs from 'node:fs';
import path from 'node:path';
import type { Asset, AssetIndex, AssetType, ScanStatus } from '../types/index.js';
import {
  getGraphicsRoot,
  getSupportedFormats,
  isModelFormat,
  isTextureFormat,
  isShaderFormat,
} from './config.js';
import {
  createEmptyIndex,
  saveAssetIndex,
  saveScanStatus,
  loadScanStatus,
} from './index-cache.js';

interface ScanOptions {
  path?: string;
  recursive?: boolean;
  force?: boolean;
}

function determineAssetType(filePath: string): AssetType | null {
  const ext = path.extname(filePath).toLowerCase();

  if (isModelFormat(ext)) {
    return 'model';
  }
  if (isTextureFormat(ext)) {
    return 'texture';
  }
  if (isShaderFormat(ext)) {
    return 'shader';
  }
  if (ext === '.ttf' || ext === '.otf' || ext === '.woff' || ext === '.woff2') {
    return 'font';
  }

  return null;
}

function determineCategory(filePath: string): string {
  const graphicsRoot = getGraphicsRoot();
  const relativePath = path.relative(graphicsRoot, filePath);
  const parts = relativePath.split(path.sep);

  // Use first directory as category
  if (parts.length > 1) {
    return parts[0];
  }

  return 'uncategorized';
}

function generateAssetId(type: AssetType, name: string): string {
  const sanitizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${type}:${sanitizedName}`;
}

function getAvailableFormats(dirPath: string, baseName: string): string[] {
  const formats: string[] = [];
  const supportedFormats = getSupportedFormats();
  const allFormats = [
    ...supportedFormats.models,
    ...supportedFormats.textures,
    ...supportedFormats.shaders,
  ];

  if (!fs.existsSync(dirPath)) {
    return formats;
  }

  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const fileBase = path.basename(file, ext);
      if (fileBase === baseName && allFormats.includes(ext)) {
        formats.push(ext);
      }
    }
  } catch {
    // Ignore errors
  }

  return formats;
}

function scanFile(filePath: string): Asset | null {
  const ext = path.extname(filePath).toLowerCase();
  const type = determineAssetType(filePath);

  if (!type) {
    return null;
  }

  const baseName = path.basename(filePath, ext);
  const dirPath = path.dirname(filePath);

  let stats: fs.Stats;
  try {
    stats = fs.statSync(filePath);
  } catch {
    return null;
  }

  const asset: Asset = {
    id: generateAssetId(type, baseName),
    name: baseName,
    type,
    category: determineCategory(filePath),
    path: filePath,
    formats: getAvailableFormats(dirPath, baseName),
    size_bytes: stats.size,
    created: stats.birthtime.toISOString(),
    modified: stats.mtime.toISOString(),
    metadata: {},
    tags: [],
    shader_compatible: type === 'model' ? ['pbr', 'unlit'] : [],
  };

  // Add format to formats if not already present
  if (!asset.formats.includes(ext)) {
    asset.formats.push(ext);
  }

  return asset;
}

function scanDirectory(
  dirPath: string,
  assets: Record<string, Asset>,
  recursive: boolean = true
): void {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    // Skip hidden files/directories and common excludes
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }

    if (entry.isDirectory() && recursive) {
      scanDirectory(fullPath, assets, recursive);
    } else if (entry.isFile()) {
      const asset = scanFile(fullPath);
      if (asset) {
        // Avoid duplicates - prefer existing entry
        if (!assets[asset.id]) {
          assets[asset.id] = asset;
        }
      }
    }
  }
}

export function performScan(options: ScanOptions = {}): AssetIndex {
  const startTime = Date.now();
  const scanPath = options.path || getGraphicsRoot();
  const recursive = options.recursive !== false;

  const index = createEmptyIndex();

  // Scan directory
  scanDirectory(scanPath, index.assets, recursive);

  // Calculate stats
  const assets = Object.values(index.assets);
  index.stats.total = assets.length;

  for (const asset of assets) {
    index.stats.by_type[asset.type] = (index.stats.by_type[asset.type] || 0) + 1;
  }

  index.scan_duration_ms = Date.now() - startTime;
  index.generated = new Date().toISOString();

  // Save index
  saveAssetIndex(index);

  // Update scan status
  const scanStatus = loadScanStatus();
  scanStatus.last_full_scan = index.generated;
  scanStatus.scan_duration_ms = index.scan_duration_ms;
  scanStatus.directories[scanPath] = {
    last_scan: index.generated,
    file_count: index.stats.total,
    total_size_bytes: assets.reduce((sum, a) => sum + a.size_bytes, 0),
  };
  saveScanStatus(scanStatus);

  return index;
}

export function performIncrementalScan(dirPath: string): { added: number; modified: number; deleted: number } {
  // TODO: Implement incremental scanning
  // For now, trigger full scan
  performScan({ path: dirPath });
  return { added: 0, modified: 0, deleted: 0 };
}
