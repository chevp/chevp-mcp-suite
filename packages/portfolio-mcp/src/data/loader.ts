import fs from 'node:fs';
import path from 'node:path';

export interface PortfolioData {
  sections: PortfolioSection[];
  technologies: string[];
  highlights: PortfolioHighlight[];
}

export interface PortfolioSection {
  name: string;
  title: string;
  description: string;
  path: string;
}

export interface PortfolioHighlight {
  name: string;
  description: string;
  technologies: string[];
}

function getWorkspaceRoot(): string {
  return process.env.CHEVP_WORKSPACE_ROOT ?? 'c:/chevp';
}

export function loadPortfolioData(): PortfolioData | null {
  const workspaceRoot = getWorkspaceRoot();
  const dataPath = path.join(workspaceRoot, 'portfolio/.mcp/portfolio.json');

  try {
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(content) as PortfolioData;
    }
  } catch (error) {
    console.error(`[portfolio-mcp] Failed to load portfolio.json:`, error);
  }

  return null;
}

export function listSectionFiles(sectionPath: string): string[] {
  const workspaceRoot = getWorkspaceRoot();
  const fullPath = path.join(workspaceRoot, 'portfolio', sectionPath);

  try {
    if (fs.existsSync(fullPath)) {
      return fs.readdirSync(fullPath).filter((f) => !f.startsWith('.'));
    }
  } catch {
    // Ignore
  }

  return [];
}
