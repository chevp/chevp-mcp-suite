import fs from 'node:fs';
import path from 'node:path';
import type { Layer } from '../types/index.js';

/**
 * External data structure from arctic-workspace/.mcp/layers.json
 */
export interface ExternalLayersData {
  workspaceStats: WorkspaceStats;
  layers: ExternalLayer[];
}

export interface WorkspaceStats {
  cmakeProjects: number;
  mavenProjects: number;
  npmPackages: number;
  executables: number;
  submodules: number;
}

export interface ExternalLayer {
  name: string;
  description: string;
  technology: string;
  path: string;
  buildScript?: string;
  buildTime?: string;
  dependsOn?: string[];
  projects: string[];
}

/**
 * Get the workspace root path
 */
function getWorkspaceRoot(): string {
  return process.env.CHEVP_WORKSPACE_ROOT ?? 'c:/chevp';
}

/**
 * Load layers data from arctic-workspace/.mcp/layers.json
 */
export function loadLayersData(): ExternalLayersData | null {
  const workspaceRoot = getWorkspaceRoot();
  const dataPath = path.join(workspaceRoot, 'arctic/arctic-workspace/.mcp/layers.json');

  try {
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(content) as ExternalLayersData;
    }
  } catch (error) {
    console.error(`[arctic-mcp] Failed to load layers.json:`, error);
  }

  return null;
}

/**
 * Convert external layers to internal Layer type
 */
export function getLayers(): Layer[] {
  const data = loadLayersData();
  if (!data) return [];

  return data.layers.map((layer) => ({
    name: layer.name,
    description: layer.description,
    technology: layer.technology,
    path: layer.path,
    projects: layer.projects,
    dependsOn: layer.dependsOn,
  }));
}

/**
 * Get workspace statistics
 */
export function getWorkspaceStats(): WorkspaceStats | null {
  const data = loadLayersData();
  return data?.workspaceStats ?? null;
}

/**
 * Get a specific layer by name
 */
export function getLayerByName(name: string): Layer | null {
  const layers = getLayers();
  return layers.find((l) => l.name === name) ?? null;
}

/**
 * Search projects across all layers
 */
export function searchProjects(query: string): Array<{ project: string; layer: string }> {
  const layers = getLayers();
  const results: Array<{ project: string; layer: string }> = [];
  const lowerQuery = query.toLowerCase();

  for (const layer of layers) {
    for (const project of layer.projects) {
      if (project.toLowerCase().includes(lowerQuery)) {
        results.push({ project, layer: layer.name });
      }
    }
  }

  return results;
}
