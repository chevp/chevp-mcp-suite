/**
 * CoreGFX MCP Server
 *
 * Provides comprehensive knowledge about the coregfx graphics foundation library
 * including its architecture, modules, classes, protocols, and integration with cryo-protocol.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerListModules } from './tools/list-modules.js';
import { registerGetModule } from './tools/get-module.js';
import { registerGetClass } from './tools/get-class.js';
import { registerGetProtoSchema } from './tools/get-proto-schema.js';
import { registerGetDataFlow } from './tools/get-data-flow.js';
import { registerGetCryoRelationship } from './tools/get-cryo-relationship.js';
import { registerSearchCode } from './tools/search-code.js';

export function createServer(): McpServer {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  let version = '1.0.0';
  try {
    const packagePath = path.join(__dirname, '../package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as {
        version: string;
      };
      version = pkg.version;
    }
  } catch {
    // Use default version
  }

  const server = new McpServer({
    name: 'coregfx-mcp',
    version,
  });

  // Register all tools
  registerListModules(server);
  registerGetModule(server);
  registerGetClass(server);
  registerGetProtoSchema(server);
  registerGetDataFlow(server);
  registerGetCryoRelationship(server);
  registerSearchCode(server);

  return server;
}
