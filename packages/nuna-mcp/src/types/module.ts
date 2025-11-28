export interface NunaModule {
  name: string;
  description: string;
  category: 'core' | 'plugin' | 'sdk' | 'utility';
  docUrl?: string;
  api?: ModuleApi;
  examples?: string[];
}

export interface ModuleApi {
  functions?: ApiFunctionInfo[];
  classes?: ApiClassInfo[];
  types?: ApiTypeInfo[];
}

export interface ApiFunctionInfo {
  name: string;
  description: string;
  signature: string;
  parameters?: ApiParameter[];
  returnType?: string;
}

export interface ApiClassInfo {
  name: string;
  description: string;
  methods?: ApiFunctionInfo[];
  properties?: ApiProperty[];
}

export interface ApiTypeInfo {
  name: string;
  description: string;
  definition: string;
}

export interface ApiParameter {
  name: string;
  type: string;
  description: string;
  optional?: boolean;
}

export interface ApiProperty {
  name: string;
  type: string;
  description: string;
  readonly?: boolean;
}
