/**
 * Type definitions for CoreGFX MCP
 * Represents the architecture and components of the coregfx graphics library
 */

export interface CoreGfxModule {
  name: string;
  description: string;
  path: string;
  status: 'stable' | 'partial' | 'planned' | 'deprecated';
  classes: string[];
  dependencies: string[];
  headerFiles: string[];
}

export interface CoreGfxClass {
  name: string;
  module: string;
  description: string;
  headerFile: string;
  pattern?: 'singleton' | 'pimpl' | 'factory' | 'interface';
  publicMethods: ClassMethod[];
  relatedClasses?: string[];
}

export interface ClassMethod {
  name: string;
  signature: string;
  description: string;
  isStatic?: boolean;
  isVirtual?: boolean;
}

export interface ProtoSchema {
  name: string;
  domain: string;
  description: string;
  filePath: string;
  lineCount: number;
  messages: ProtoMessage[];
  services: ProtoService[];
}

export interface ProtoMessage {
  name: string;
  description: string;
  fields: ProtoField[];
}

export interface ProtoField {
  name: string;
  type: string;
  number: number;
  repeated: boolean;
  optional: boolean;
  description?: string;
}

export interface ProtoService {
  name: string;
  description: string;
  methods: ProtoServiceMethod[];
}

export interface ProtoServiceMethod {
  name: string;
  inputType: string;
  outputType: string;
  clientStreaming: boolean;
  serverStreaming: boolean;
  description?: string;
}

export interface DataFlow {
  name: string;
  description: string;
  steps: DataFlowStep[];
}

export interface DataFlowStep {
  order: number;
  component: string;
  action: string;
  details?: string;
}

export interface CryoRelationship {
  coregfxComponent: string;
  cryoProtocol: string;
  description: string;
  dataDirection: 'coregfx-to-cryo' | 'cryo-to-coregfx' | 'bidirectional';
  usedMessages?: string[];
}

export interface CoreGfxArchitecture {
  modules: CoreGfxModule[];
  classes: CoreGfxClass[];
  protoSchemas: ProtoSchema[];
  dataFlows: DataFlow[];
  cryoRelationships: CryoRelationship[];
  stats: {
    totalModules: number;
    totalClasses: number;
    totalProtoFiles: number;
    linesOfCode: number;
  };
}
