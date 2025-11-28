import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export { McpServer, StdioServerTransport };
export { z } from 'zod';

/**
 * Configuration for creating an MCP server
 */
export interface McpServerConfig {
  name: string;
  version?: string;
  packageJsonPath?: string;
}

/**
 * Creates an MCP server with standard configuration
 */
export function createMcpServer(config: McpServerConfig): McpServer {
  let version = config.version ?? '1.0.0';

  if (config.packageJsonPath) {
    try {
      if (fs.existsSync(config.packageJsonPath)) {
        const pkg = JSON.parse(fs.readFileSync(config.packageJsonPath, 'utf8')) as { version: string };
        version = pkg.version;
      }
    } catch {
      // Use default version
    }
  }

  return new McpServer({
    name: config.name,
    version,
  });
}

/**
 * Starts an MCP server with stdio transport
 */
export async function startStdioServer(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

/**
 * Helper to get package.json path relative to a module
 */
export function getPackageJsonPath(importMetaUrl: string): string {
  const __filename = fileURLToPath(importMetaUrl);
  const __dirname = path.dirname(__filename);
  return path.join(__dirname, '../package.json');
}

/**
 * Standard tool response helper
 */
export function toolResponse(data: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Load data from external path (for Option A: Doku bleibt beim Projekt)
 */
export function loadExternalData<T>(dataPath: string): T | null {
  try {
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf8');
      if (dataPath.endsWith('.json')) {
        return JSON.parse(content) as T;
      }
      // For YAML, you'd need to add yaml package
      return content as unknown as T;
    }
  } catch (error) {
    console.error(`Failed to load data from ${dataPath}:`, error);
  }
  return null;
}

/**
 * Resolve data path relative to workspace root
 */
export function resolveWorkspacePath(...segments: string[]): string {
  // Default workspace root is c:/chevp
  const workspaceRoot = process.env.CHEVP_WORKSPACE_ROOT ?? 'c:/chevp';
  return path.join(workspaceRoot, ...segments);
}
