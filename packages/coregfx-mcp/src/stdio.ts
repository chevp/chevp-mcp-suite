/**
 * CoreGFX MCP - Stdio Transport Entry Point
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './index.js';

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('CoreGFX MCP server error:', error);
  process.exit(1);
});
