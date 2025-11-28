/**
 * Arctic Workspace Layer
 */
export interface Layer {
  name: string;
  description: string;
  technology: string;
  path: string;
  projects: string[];
}

/**
 * Arctic Workspace Project
 */
export interface Project {
  name: string;
  description: string;
  layer: string;
  path: string;
  technology: 'cmake' | 'maven' | 'npm' | 'nx';
  type: 'library' | 'application' | 'protocol';
  dependencies?: string[];
  buildCommand?: string;
  outputs?: string[];
}

/**
 * Build command configuration
 */
export interface BuildCommand {
  name: string;
  command: string;
  description: string;
  workingDir?: string;
  dependencies?: string[];
}

/**
 * Layer statistics
 */
export interface LayerStats {
  projectCount: number;
  technologies: string[];
  estimatedLOC?: number;
}

/**
 * Data path configuration for external data loading
 */
export interface DataConfig {
  workspacePath: string;
  layersFile?: string;
  projectsFile?: string;
}
