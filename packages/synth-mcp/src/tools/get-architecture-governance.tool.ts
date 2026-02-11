/**
 * MCP Tool Registration: get-architecture-governance
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getArchitectureGovernance, checkGovernanceCompliance } from './get-architecture-governance.js';

export function registerGetArchitectureGovernance(server: McpServer): void {
  server.addTool({
    name: 'synth__get_architecture_governance',
    description: `Get Architecture Governance rules for synth-game.

🔒 MANDATORY document that MUST be consulted before ANY architectural changes.

Returns binding rules to prevent code drift between multiple client implementations
(Three.js Browser, Vulkan C++, Android WebView) and ensure consistent architecture.

Use this tool when:
- Planning to add client-side game logic
- Changing protocol definitions (synth-protocol)
- Modifying XML schema
- Adding new client implementation
- Implementing server-side features

Available sections:
- Core Principles (server-authoritative, shared protocol, XML single source)
- Client Architecture Matrix (responsibility allocation)
- Drift Prevention Strategies
- Forbidden Patterns
- Change Approval Process
- Compliance Checklist`,
    inputSchema: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          description: 'Optional: Get specific section (e.g., "Forbidden Patterns", "Core Principles"). Leave empty for full document.',
        },
      },
    },
    handler: async (input) => {
      const section = input.section as string | undefined;
      const result = getArchitectureGovernance(section);

      if (typeof result === 'string') {
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      // Format full governance document
      const formatted = `# Architecture Governance - synth-game

**Status:** ${result.status}
**Last Updated:** ${result.lastUpdated}

## Available Sections

${result.sections.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}

---

${result.fullDocument}
`;

      return {
        content: [
          {
            type: 'text',
            text: formatted,
          },
        ],
      };
    },
  });

  server.addTool({
    name: 'synth__check_governance_compliance',
    description: `Check if a proposed change violates Architecture Governance rules.

Use this tool BEFORE implementing changes to verify compliance with governance.

Returns:
- compliant: true/false
- violations: List of rule violations
- recommendations: How to fix violations`,
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['client-logic', 'protocol-change', 'xml-schema', 'rendering'],
          description: 'Type of change being proposed',
        },
        description: {
          type: 'string',
          description: 'Description of the proposed change',
        },
        affectedClients: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of affected clients (e.g., ["threejs", "vulkan", "java"])',
        },
      },
      required: ['type', 'description'],
    },
    handler: async (input) => {
      const result = checkGovernanceCompliance({
        type: input.type as any,
        description: input.description as string,
        affectedClients: input.affectedClients as string[] | undefined,
      });

      const formatted = `# Governance Compliance Check

**Type:** ${input.type}
**Description:** ${input.description}

## Result: ${result.compliant ? '✅ COMPLIANT' : '❌ VIOLATIONS DETECTED'}

${
  result.violations.length > 0
    ? `### ⚠️ Violations:\n${result.violations.map((v) => `- ${v}`).join('\n')}`
    : ''
}

${
  result.recommendations.length > 0
    ? `### 💡 Recommendations:\n${result.recommendations.map((r) => `- ${r}`).join('\n')}`
    : ''
}

${!result.compliant ? '\n**Action Required:** Consult ARCHITECTURE_GOVERNANCE.md before proceeding.' : ''}
`;

      return {
        content: [{ type: 'text', text: formatted }],
      };
    },
  });
}
