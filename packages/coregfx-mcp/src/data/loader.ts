/**
 * External data loader for CoreGFX MCP
 * Loads runtime data from the coregfx codebase when available
 */

import fs from 'node:fs';
import path from 'node:path';

const WORKSPACE_ROOT = process.env.CHEVP_WORKSPACE_ROOT ?? 'c:/chevp';
const COREGFX_PATH = path.join(
  WORKSPACE_ROOT,
  'arctic/arctic-workspace/foundation/coregfx'
);

export interface ExternalCoregfxData {
  modules: string[];
  protoFiles: string[];
  headerFiles: string[];
}

/**
 * Load coregfx data from the actual codebase
 */
export function loadExternalData(): ExternalCoregfxData | null {
  try {
    if (!fs.existsSync(COREGFX_PATH)) {
      console.error(`CoreGFX path not found: ${COREGFX_PATH}`);
      return null;
    }

    const modules = listDirectories(path.join(COREGFX_PATH, 'include/coregfx'));
    const protoFiles = listFilesWithExtension(
      path.join(COREGFX_PATH, 'proto'),
      '.proto'
    );
    const headerFiles = listFilesRecursive(
      path.join(COREGFX_PATH, 'include'),
      '.hpp'
    );

    return {
      modules,
      protoFiles,
      headerFiles,
    };
  } catch (error) {
    console.error('Failed to load external coregfx data:', error);
    return null;
  }
}

/**
 * Read the content of a specific header file
 */
export function readHeaderFile(relativePath: string): string | null {
  try {
    const fullPath = path.join(COREGFX_PATH, 'include', relativePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8');
    }

    // Try searching recursively
    const found = findFileRecursive(
      path.join(COREGFX_PATH, 'include'),
      path.basename(relativePath)
    );
    if (found) {
      return fs.readFileSync(found, 'utf8');
    }

    return null;
  } catch (error) {
    console.error(`Failed to read header file ${relativePath}:`, error);
    return null;
  }
}

/**
 * Read the content of a specific proto file
 */
export function readProtoFile(fileName: string): string | null {
  try {
    const protoDir = path.join(COREGFX_PATH, 'proto');
    const fullPath = path.join(protoDir, fileName);

    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8');
    }

    // Try with .proto extension
    const withExt = fullPath.endsWith('.proto') ? fullPath : `${fullPath}.proto`;
    if (fs.existsSync(withExt)) {
      return fs.readFileSync(withExt, 'utf8');
    }

    return null;
  } catch (error) {
    console.error(`Failed to read proto file ${fileName}:`, error);
    return null;
  }
}

/**
 * Get the path to the coregfx directory
 */
export function getCoregfxPath(): string {
  return COREGFX_PATH;
}

/**
 * Check if the coregfx codebase is available
 */
export function isCoregfxAvailable(): boolean {
  return fs.existsSync(COREGFX_PATH);
}

/**
 * List all proto files with their line counts
 */
export function listProtoFilesWithStats(): Array<{
  name: string;
  path: string;
  lineCount: number;
}> {
  const protoDir = path.join(COREGFX_PATH, 'proto');
  if (!fs.existsSync(protoDir)) {
    return [];
  }

  const files = fs.readdirSync(protoDir).filter((f) => f.endsWith('.proto'));

  return files.map((file) => {
    const filePath = path.join(protoDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lineCount = content.split('\n').length;

    return {
      name: file,
      path: `proto/${file}`,
      lineCount,
    };
  });
}

/**
 * Search for a pattern in header files
 */
export function searchInHeaders(
  pattern: string
): Array<{ file: string; line: number; content: string }> {
  const results: Array<{ file: string; line: number; content: string }> = [];
  const includeDir = path.join(COREGFX_PATH, 'include');

  if (!fs.existsSync(includeDir)) {
    return results;
  }

  const regex = new RegExp(pattern, 'i');
  const headerFiles = listFilesRecursive(includeDir, '.hpp');

  for (const file of headerFiles.slice(0, 100)) {
    // Limit to 100 files
    try {
      const fullPath = path.join(includeDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          results.push({
            file,
            line: i + 1,
            content: lines[i].trim(),
          });

          if (results.length >= 50) {
            return results; // Limit results
          }
        }
      }
    } catch {
      // Skip files that can't be read
    }
  }

  return results;
}

// Helper functions

function listDirectories(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function listFilesWithExtension(dirPath: string, ext: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath).filter((f) => f.endsWith(ext));
}

function listFilesRecursive(dirPath: string, ext: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dirPath)) {
    return results;
  }

  function walk(currentPath: string, relativePath: string): void {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relPath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else if (entry.name.endsWith(ext)) {
        results.push(relPath.replace(/\\/g, '/'));
      }
    }
  }

  walk(dirPath, '');
  return results;
}

function findFileRecursive(dirPath: string, fileName: string): string | null {
  if (!fs.existsSync(dirPath)) {
    return null;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const found = findFileRecursive(fullPath, fileName);
      if (found) {
        return found;
      }
    } else if (entry.name === fileName) {
      return fullPath;
    }
  }

  return null;
}
