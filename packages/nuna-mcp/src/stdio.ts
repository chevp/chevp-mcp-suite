#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './index.js';

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  console.error('[nuna-mcp] fatal:', err);
  process.exit(1);
});
