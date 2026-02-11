import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { validate } from '../data/synth-game.js';

export function registerValidateSynthGame(server: McpServer): void {
  server.tool(
    'validate_synth_game',
    'Validate synth-game XML files: check component refs, route consistency, duplicate IDs, missing properties, producerId uniqueness',
    {},
    async () => {
      const issues = validate();

      const errors = issues.filter((i) => i.severity === 'error');
      const warnings = issues.filter((i) => i.severity === 'warning');

      const result = {
        valid: errors.length === 0,
        errorCount: errors.length,
        warningCount: warnings.length,
        errors,
        warnings,
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
}
