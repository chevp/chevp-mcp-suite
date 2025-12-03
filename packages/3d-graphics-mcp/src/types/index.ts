// Asset Types
export type AssetType = 'model' | 'texture' | 'material' | 'shader' | 'scene' | 'animation' | 'font';

export interface AssetMetadata {
  vertices?: number;
  faces?: number;
  materials?: string[];
  textures?: string[];
  rigged?: boolean;
  animated?: boolean;
  width?: number;
  height?: number;
  format?: string;
  channels?: number;
  bitDepth?: number;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  category: string;
  path: string;
  formats: string[];
  size_bytes: number;
  created: string;
  modified: string;
  metadata: AssetMetadata;
  tags: string[];
  shader_compatible: string[];
  thumbnail?: string;
}

// Index Cache Types
export interface IndexStats {
  total: number;
  by_type: Record<AssetType, number>;
}

export interface AssetIndex {
  version: string;
  generated: string;
  scan_duration_ms: number;
  stats: IndexStats;
  assets: Record<string, Asset>;
}

export interface DirectoryScanInfo {
  last_scan: string;
  file_count: number;
  total_size_bytes: number;
  hash?: string;
}

export interface IncrementalScan {
  timestamp: string;
  path: string;
  changes: {
    added: number;
    modified: number;
    deleted: number;
  };
}

export interface ScanStatus {
  last_full_scan: string;
  scan_duration_ms: number;
  directories: Record<string, DirectoryScanInfo>;
  incremental_scans: IncrementalScan[];
}

// Pipeline Types
export interface PipelineStepArgs {
  [key: string]: string | boolean | number;
}

export interface PipelineStep {
  tool?: string;
  pipeline?: string;
  action?: string;
  args?: PipelineStepArgs | string[];
  apply_to?: string;
}

export interface PipelineOption {
  type: 'boolean' | 'string' | 'number' | 'enum';
  default?: string | boolean | number;
  values?: string[];
  description?: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  input_formats: string[];
  output_format: string;
  steps: PipelineStep[];
  options?: Record<string, PipelineOption>;
}

export interface PipelineTool {
  executable: string;
  version_required?: string;
  args?: string[];
  scripts_path?: string;
}

export interface PipelineDefinitions {
  version: string;
  pipelines: Record<string, Pipeline>;
  tools: Record<string, PipelineTool>;
}

export interface PipelineJob {
  id: string;
  pipeline_id: string;
  input: string;
  output: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started?: string;
  completed?: string;
  error?: string;
  progress?: number;
}

// Shader Types
export interface ShaderProfile {
  id: string;
  name: string;
  description: string;
  target: string;
  required_maps: string[];
  optional_maps: string[];
  material_properties?: string[];
}

export interface ShaderDefinitions {
  version: string;
  shader_profiles: Record<string, ShaderProfile>;
  compatibility_matrix: Record<string, string[]>;
}

// Config Types
export interface Config {
  version: string;
  graphics_root: string;
  deployment_target: string;
  scan_patterns: {
    include: string[];
    exclude: string[];
  };
  supported_formats: {
    models: string[];
    textures: string[];
    shaders: string[];
  };
}

// Search Types
export interface SearchFilter {
  type?: AssetType;
  category?: string;
  format?: string;
  shader?: string;
  min_size?: number;
  max_size?: number;
  tags?: string[];
}

export interface SearchResult {
  asset: Asset;
  score: number;
  matches: string[];
}
