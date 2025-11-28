import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerListLayers } from './tools/list-layers.js';
import { registerGetLayer } from './tools/get-layer.js';
import { registerListProjects } from './tools/list-projects.js';
import { registerGetProject } from './tools/get-project.js';
import { registerGetBuildCommands } from './tools/get-build-commands.js';
import { registerSearchProjects } from './tools/search-projects.js';
import { registerGetDependencies } from './tools/get-dependencies.js';

export function createServer(): McpServer {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  let version = '1.0.0';
  try {
    const packagePath = path.join(__dirname, '../package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { version: string };
      version = pkg.version;
    }
  } catch {
    // Use default version
  }

  const server = new McpServer({
    name: 'arctic-mcp',
    version,
  });

  // Register tool modules
  registerListLayers(server);
  registerGetLayer(server);
  registerListProjects(server);
  registerGetProject(server);
  registerGetBuildCommands(server);
  registerSearchProjects(server);
  registerGetDependencies(server);

  return server;
}
