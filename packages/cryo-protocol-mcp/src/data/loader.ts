import fs from 'node:fs';
import path from 'node:path';

/**
 * External data from arctic-workspace/.mcp/protocols.json
 */
export interface ExternalProtocolData {
  stats: {
    totalProtoFiles: number;
    foundationPath: string;
  };
  domains: ExternalDomain[];
}

export interface ExternalDomain {
  name: string;
  description: string;
  path: string;
  categories: ExternalCategory[];
}

export interface ExternalCategory {
  name: string;
  description: string;
  protoFiles: string[];
}

/**
 * Get the workspace root path
 */
function getWorkspaceRoot(): string {
  return process.env.CHEVP_WORKSPACE_ROOT ?? 'c:/chevp';
}

/**
 * Load protocol data from arctic-workspace/.mcp/protocols.json
 */
export function loadProtocolData(): ExternalProtocolData | null {
  const workspaceRoot = getWorkspaceRoot();
  const dataPath = path.join(workspaceRoot, 'arctic/arctic-workspace/.mcp/protocols.json');

  try {
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(content) as ExternalProtocolData;
    }
  } catch (error) {
    console.error(`[cryo-protocol-mcp] Failed to load protocols.json:`, error);
  }

  return null;
}

/**
 * List actual proto files from a domain directory
 */
export function listProtoFiles(domainPath: string): string[] {
  const workspaceRoot = getWorkspaceRoot();
  const fullPath = path.join(workspaceRoot, 'arctic/arctic-workspace', domainPath);

  try {
    if (fs.existsSync(fullPath)) {
      return findProtoFilesRecursive(fullPath);
    }
  } catch (error) {
    console.error(`[cryo-protocol-mcp] Failed to list proto files:`, error);
  }

  return [];
}

/**
 * Recursively find all .proto files
 */
function findProtoFilesRecursive(dir: string): string[] {
  const protoFiles: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        protoFiles.push(...findProtoFilesRecursive(fullPath));
      } else if (entry.name.endsWith('.proto')) {
        // Return relative path from the domain directory
        protoFiles.push(entry.name);
      }
    }
  } catch {
    // Ignore errors for inaccessible directories
  }

  return protoFiles;
}

/**
 * Read a specific proto file content
 */
export function readProtoFile(domainPath: string, fileName: string): string | null {
  const workspaceRoot = getWorkspaceRoot();

  // Try direct path first
  let fullPath = path.join(workspaceRoot, 'arctic/arctic-workspace', domainPath, fileName);

  if (!fs.existsSync(fullPath)) {
    // Try searching in subdirectories
    const basePath = path.join(workspaceRoot, 'arctic/arctic-workspace', domainPath);
    fullPath = findFileRecursive(basePath, fileName) ?? fullPath;
  }

  try {
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8');
    }
  } catch (error) {
    console.error(`[cryo-protocol-mcp] Failed to read proto file:`, error);
  }

  return null;
}

/**
 * Find a file recursively in a directory
 */
function findFileRecursive(dir: string, fileName: string): string | null {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const found = findFileRecursive(fullPath, fileName);
        if (found) return found;
      } else if (entry.name === fileName) {
        return fullPath;
      }
    }
  } catch {
    // Ignore
  }

  return null;
}
