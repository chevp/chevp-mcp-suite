import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerListProtocols } from './tools/list-protocols.js';
import { registerGetProtocol } from './tools/get-protocol.js';
import { registerGetProtoFile } from './tools/get-proto-file.js';

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
    name: 'cryo-protocol-mcp',
    version,
  });

  // Register tool modules
  registerListProtocols(server);
  registerGetProtocol(server);
  registerGetProtoFile(server);

  return server;
}
