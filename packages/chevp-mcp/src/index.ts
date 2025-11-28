import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerGetDesignSystem } from './tools/get-design-system.js';
import { registerGetCategories } from './tools/get-categories.js';
import { registerGetColorPalette } from './tools/get-color-palette.js';
import { registerGetComponentStyles } from './tools/get-component-styles.js';
import { registerValidateRepository } from './tools/validate-repository.js';
import { registerSuggestCategory } from './tools/suggest-category.js';
import { registerGetHtmlTemplate } from './tools/get-html-template.js';
import { registerGetPreferences } from './tools/get-preferences.js';

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
    name: 'chevp-mcp',
    version,
  });

  // Register tool modules
  registerGetDesignSystem(server);
  registerGetCategories(server);
  registerGetColorPalette(server);
  registerGetComponentStyles(server);
  registerValidateRepository(server);
  registerSuggestCategory(server);
  registerGetHtmlTemplate(server);
  registerGetPreferences(server);

  return server;
}
