import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  architectureStrategy,
  checkArchitectureViolation,
  getMigrationRecommendation,
  getComponentsToMigrate,
  getComponentsMustStayCpp,
  type ArchitectureRule,
  type ComponentClassification,
} from '../data/architecture-strategy.js';

export function registerCheckArchitecture(server: McpServer): void {
  server.tool(
    'check_architecture',
    'Check if code or component placement follows nuna-sdk-cpp architecture rules. Use this to validate that C++ code is only used for rendering, runtime-critical, or platform-specific functionality.',
    {
      code: z
        .string()
        .optional()
        .describe('Code snippet to analyze for architecture violations'),
      component: z
        .string()
        .optional()
        .describe('Component name to get migration recommendation'),
      language: z
        .enum(['cpp', 'nodejs'])
        .optional()
        .describe('Target language of the code being analyzed'),
    },
    async ({ code, component, language }) => {
      const results: string[] = [];

      // Check code for violations
      if (code && language) {
        const violations = checkArchitectureViolation(code, language);

        if (violations.length > 0) {
          results.push('## Architecture Violations Found\n');
          for (const violation of violations) {
            results.push(`### ${violation.id}`);
            results.push(`**Warning**: ${violation.warningMessage}`);
            results.push(`**Rule**: ${violation.description}`);
            results.push(`**Expected scope**: ${violation.scope}\n`);
          }
        } else {
          results.push('No architecture violations detected in the code.');
        }
      }

      // Get component recommendation
      if (component) {
        const recommendation = getMigrationRecommendation(component);

        if (recommendation) {
          results.push(`\n## Component: ${recommendation.name}\n`);
          results.push(`**Current Location**: ${recommendation.currentLocation}`);
          results.push(`**Classification**: ${recommendation.classification}`);
          results.push(`**Reason**: ${recommendation.reason}`);

          if (recommendation.migrationEffort) {
            results.push(`**Migration Effort**: ${recommendation.migrationEffort}`);
          }
          if (recommendation.migrationTarget) {
            results.push(`**Migration Target**: ${recommendation.migrationTarget}`);
          }

          // Add action recommendation
          if (recommendation.classification === 'SHOULD_MIGRATE') {
            results.push(
              '\n**Action**: This component should be migrated to Node.js.'
            );
          } else if (recommendation.classification === 'MUST_STAY_CPP') {
            results.push('\n**Action**: Keep this component in C++.');
          } else if (recommendation.classification === 'HYBRID') {
            results.push(
              '\n**Action**: Identify which parts can migrate to Node.js.'
            );
          }
        } else {
          results.push(`\nComponent "${component}" not found in classification.`);
          results.push('Consider analyzing it against the architecture rules.');
        }
      }

      // If neither provided, show architecture overview
      if (!code && !component) {
        results.push('## Nuna SDK Architecture Strategy\n');
        results.push('### C++ Scope (MUST stay in C++)');
        for (const item of architectureStrategy.principles.cppScope) {
          results.push(`- ${item}`);
        }

        results.push('\n### Node.js Scope (SHOULD be migrated)');
        for (const item of architectureStrategy.principles.nodejsScope) {
          results.push(`- ${item}`);
        }

        results.push('\n### Use this tool with:');
        results.push('- `code` + `language`: Check code for violations');
        results.push('- `component`: Get migration recommendation');
      }

      return {
        content: [{ type: 'text', text: results.join('\n') }],
      };
    }
  );
}

export function registerListMigrationCandidates(server: McpServer): void {
  server.tool(
    'list_migration_candidates',
    'List all nuna-sdk-cpp components that should be migrated to Node.js, with effort estimates and migration targets.',
    {
      filter: z
        .enum(['all', 'should_migrate', 'can_migrate', 'must_stay_cpp', 'hybrid'])
        .optional()
        .describe('Filter components by classification'),
    },
    async ({ filter }) => {
      let components: ComponentClassification[];

      switch (filter) {
        case 'should_migrate':
          components = architectureStrategy.componentClassifications.filter(
            (c) => c.classification === 'SHOULD_MIGRATE'
          );
          break;
        case 'can_migrate':
          components = architectureStrategy.componentClassifications.filter(
            (c) => c.classification === 'CAN_MIGRATE'
          );
          break;
        case 'must_stay_cpp':
          components = getComponentsMustStayCpp();
          break;
        case 'hybrid':
          components = architectureStrategy.componentClassifications.filter(
            (c) => c.classification === 'HYBRID'
          );
          break;
        default:
          components = architectureStrategy.componentClassifications;
      }

      const results: string[] = [];
      results.push('# Nuna SDK Component Classifications\n');

      // Group by classification
      const grouped: Record<string, ComponentClassification[]> = {};
      for (const comp of components) {
        if (!grouped[comp.classification]) {
          grouped[comp.classification] = [];
        }
        grouped[comp.classification].push(comp);
      }

      for (const [classification, comps] of Object.entries(grouped)) {
        results.push(`## ${classification}\n`);

        for (const comp of comps) {
          results.push(`### ${comp.name}`);
          results.push(`- **Location**: ${comp.currentLocation}`);
          results.push(`- **Reason**: ${comp.reason}`);
          if (comp.migrationEffort) {
            results.push(`- **Effort**: ${comp.migrationEffort}`);
          }
          if (comp.migrationTarget) {
            results.push(`- **Target**: ${comp.migrationTarget}`);
          }
          results.push('');
        }
      }

      // Add migration phases
      results.push('## Migration Phases\n');
      for (const phase of architectureStrategy.migrationPhases) {
        results.push(`### Phase ${phase.phase}: ${phase.name}`);
        results.push(`- **Duration**: ${phase.duration}`);
        results.push(`- **Description**: ${phase.description}`);
        results.push(`- **Components**: ${phase.components.join(', ')}`);
        results.push('');
      }

      return {
        content: [{ type: 'text', text: results.join('\n') }],
      };
    }
  );
}

export function registerGetArchitectureRules(server: McpServer): void {
  server.tool(
    'get_architecture_rules',
    'Get all architecture governance rules for nuna-sdk-cpp. Use these rules to validate code placement.',
    {
      scope: z
        .enum(['cpp', 'nodejs', 'all'])
        .optional()
        .describe('Filter rules by scope'),
    },
    async ({ scope }) => {
      let rules: ArchitectureRule[];

      if (scope && scope !== 'all') {
        rules = architectureStrategy.rules.filter((r) => r.scope === scope);
      } else {
        rules = architectureStrategy.rules;
      }

      const results: string[] = [];
      results.push('# Architecture Governance Rules\n');

      const cppRules = rules.filter((r) => r.scope === 'cpp');
      const nodejsRules = rules.filter((r) => r.scope === 'nodejs');

      if (cppRules.length > 0) {
        results.push('## C++ Scope Rules (MUST be in C++)\n');
        for (const rule of cppRules) {
          results.push(`### ${rule.id}`);
          results.push(`**Description**: ${rule.description}`);
          results.push(`**Keywords**: \`${rule.keywords.join('`, `')}\``);
          results.push(`**Warning**: ${rule.warningMessage}\n`);
        }
      }

      if (nodejsRules.length > 0) {
        results.push('## Node.js Scope Rules (SHOULD migrate)\n');
        for (const rule of nodejsRules) {
          results.push(`### ${rule.id}`);
          results.push(`**Description**: ${rule.description}`);
          results.push(`**Keywords**: \`${rule.keywords.join('`, `')}\``);
          if (rule.antiPatterns) {
            results.push(`**Anti-patterns**: \`${rule.antiPatterns.join('`, `')}\``);
          }
          results.push(`**Warning**: ${rule.warningMessage}\n`);
        }
      }

      return {
        content: [{ type: 'text', text: results.join('\n') }],
      };
    }
  );
}
