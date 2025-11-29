import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerListModules } from './tools/list-modules.js';
import { registerGetModule } from './tools/get-module.js';
import { registerSearchModules } from './tools/search-modules.js';
import { registerGetModuleApi } from './tools/get-module-api.js';
import { registerGetModuleExamples } from './tools/get-module-examples.js';
import {
  registerCheckArchitecture,
  registerListMigrationCandidates,
  registerGetArchitectureRules,
} from './tools/check-architecture.js';

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
    name: 'nuna-mcp',
    version,
  });

  // Register module documentation tools
  registerListModules(server);
  registerGetModule(server);
  registerSearchModules(server);
  registerGetModuleApi(server);
  registerGetModuleExamples(server);

  // Register architecture governance tools
  registerCheckArchitecture(server);
  registerListMigrationCandidates(server);
  registerGetArchitectureRules(server);

  return server;
}
