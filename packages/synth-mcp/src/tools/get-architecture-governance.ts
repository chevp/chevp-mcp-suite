/**
 * Get Architecture Governance rules for synth-game
 *
 * Returns the binding architecture governance document that MUST be consulted
 * before making any architectural changes to synth-game.
 */

import fs from 'node:fs';
import path from 'node:path';

const GOVERNANCE_FILE = 'c:/chevp/synth/synth-playground/synth-game/docs/ARCHITECTURE_GOVERNANCE.md';

export interface GovernanceSection {
  title: string;
  content: string;
}

export interface ArchitectureGovernance {
  status: string;
  lastUpdated: string;
  sections: GovernanceSection[];
  fullDocument: string;
}

export function getArchitectureGovernance(section?: string): ArchitectureGovernance | string {
  if (!fs.existsSync(GOVERNANCE_FILE)) {
    return {
      status: 'ERROR',
      lastUpdated: 'N/A',
      sections: [],
      fullDocument: 'Governance document not found. Expected at: ' + GOVERNANCE_FILE,
    };
  }

  const content = fs.readFileSync(GOVERNANCE_FILE, 'utf8');

  // Extract last updated date
  const lastUpdatedMatch = content.match(/\*\*Last Updated:\*\* (.+)/);
  const lastUpdated = lastUpdatedMatch ? lastUpdatedMatch[1] : 'Unknown';

  // Parse sections (## headers)
  const sections: GovernanceSection[] = [];
  const sectionRegex = /^## (.+)$/gm;
  let match;
  const sectionStarts: { title: string; index: number }[] = [];

  while ((match = sectionRegex.exec(content)) !== null) {
    sectionStarts.push({
      title: match[1],
      index: match.index,
    });
  }

  // Extract content for each section
  for (let i = 0; i < sectionStarts.length; i++) {
    const start = sectionStarts[i];
    const end = i < sectionStarts.length - 1 ? sectionStarts[i + 1].index : content.length;
    const sectionContent = content.slice(start.index, end).trim();

    sections.push({
      title: start.title,
      content: sectionContent,
    });
  }

  // If specific section requested, return only that section
  if (section) {
    const foundSection = sections.find((s) =>
      s.title.toLowerCase().includes(section.toLowerCase())
    );

    if (foundSection) {
      return foundSection.content;
    } else {
      return `Section "${section}" not found. Available sections:\n${sections.map(s => `- ${s.title}`).join('\n')}`;
    }
  }

  // Return full governance data
  return {
    status: '🔒 MANDATORY',
    lastUpdated,
    sections: sections.map((s) => ({ title: s.title, content: s.content })),
    fullDocument: content,
  };
}

/**
 * Check if a proposed change violates governance rules
 */
export function checkGovernanceCompliance(change: {
  type: 'client-logic' | 'protocol-change' | 'xml-schema' | 'rendering';
  description: string;
  affectedClients?: string[];
}): { compliant: boolean; violations: string[]; recommendations: string[] } {
  const violations: string[] = [];
  const recommendations: string[] = [];

  switch (change.type) {
    case 'client-logic':
      violations.push(
        'VIOLATION: Client-side game logic detected. Server MUST be authoritative for all game state.'
      );
      recommendations.push('Move logic to Java backend (backend/src/main/java/)');
      recommendations.push('Clients should only collect input and render state');
      recommendations.push('See ARCHITECTURE_GOVERNANCE.md § Forbidden Patterns');
      break;

    case 'protocol-change':
      if (!change.description.includes('synth-protocol')) {
        violations.push(
          'VIOLATION: Protocol change must update synth-protocol/*.proto files first'
        );
        recommendations.push('Update synth-protocol/entity.proto or relevant .proto file');
        recommendations.push('Run ./generate-all.sh to generate code for all languages');
        recommendations.push('Update ALL clients: Three.js, Vulkan C++, Java');
      }
      break;

    case 'xml-schema':
      if (!change.affectedClients || change.affectedClients.length < 3) {
        violations.push(
          'VIOLATION: XML schema change must update ALL parsers (Three.js, Vulkan C++, Java)'
        );
        recommendations.push('Update SynthXmlParser.js (threejs-client)');
        recommendations.push('Update CgfxSceneLoader (frost-runtime)');
        recommendations.push('Update SceneParser.java (backend)');
        recommendations.push('Update test fixtures in assets/test-fixtures/');
      }
      break;

    case 'rendering':
      // Rendering drift is allowed (platform-specific)
      recommendations.push('Rendering is platform-specific, drift is acceptable');
      recommendations.push(
        'Ensure both clients render the same visual result from same XML input'
      );
      break;
  }

  return {
    compliant: violations.length === 0,
    violations,
    recommendations,
  };
}
