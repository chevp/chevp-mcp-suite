/**
 * Protocol domain categorization
 */
export interface ProtocolDomain {
  name: string;
  description: string;
  protoFiles: string[];
  messageCount: number;
  serviceCount: number;
}

/**
 * Protocol message definition
 */
export interface ProtocolMessage {
  name: string;
  description: string;
  domain: string;
  fields: MessageField[];
  protoFile: string;
}

/**
 * Message field definition
 */
export interface MessageField {
  name: string;
  type: string;
  number: number;
  repeated: boolean;
  optional: boolean;
  description?: string;
}

/**
 * gRPC service definition
 */
export interface GrpcService {
  name: string;
  description: string;
  domain: string;
  methods: ServiceMethod[];
  protoFile: string;
}

/**
 * Service method definition
 */
export interface ServiceMethod {
  name: string;
  description?: string;
  inputType: string;
  outputType: string;
  clientStreaming: boolean;
  serverStreaming: boolean;
}
