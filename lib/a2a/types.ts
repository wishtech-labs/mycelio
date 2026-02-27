/**
 * A2A (Agent-to-Agent) Protocol Types
 * Based on Google's A2A Protocol Specification
 * https://github.com/a2aproject/A2A
 */

// ============================================
// Agent Card - Describes agent capabilities
// ============================================
export interface AgentCard {
  name: string;
  description: string;
  url: string;
  provider?: {
    name: string;
    url?: string;
  };
  version: string;
  documentationUrl?: string;
  capabilities: {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
  };
  authentication?: {
    schemes: string[]; // "apiKey", "oauth2", etc.
    credentials?: string;
  };
  defaultInputModes: string[]; // "text", "file", etc.
  defaultOutputModes: string[];
  skills: AgentSkill[];
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
}

// ============================================
// Task Management
// ============================================
export type TaskState = 
  | 'submitted' 
  | 'working' 
  | 'input-required' 
  | 'completed' 
  | 'canceled' 
  | 'failed';

export interface Task {
  id: string;
  sessionId?: string;
  status: TaskStatus;
  history?: Message[];
  artifacts?: Artifact[];
  metadata?: Record<string, any>;
}

export interface TaskStatus {
  state: TaskState;
  message?: Message;
  timestamp?: string;
}

// ============================================
// Messages
// ============================================
export interface Message {
  role: 'user' | 'agent';
  parts: Part[];
  metadata?: Record<string, any>;
}

export type Part = 
  | TextPart 
  | FilePart 
  | DataPart;

export interface TextPart {
  type: 'text';
  text: string;
}

export interface FilePart {
  type: 'file';
  file: {
    name?: string;
    mimeType?: string;
    bytes?: string; // base64
    uri?: string;
  };
}

export interface DataPart {
  type: 'data';
  data: Record<string, any>;
}

// ============================================
// Artifacts - Task outputs
// ============================================
export interface Artifact {
  name?: string;
  description?: string;
  parts: Part[];
  metadata?: Record<string, any>;
  append?: boolean; // If true, append to existing artifact
  index?: number; // Position for appending
}

// ============================================
// Task Requests & Responses
// ============================================
export interface TaskSendParams {
  id: string;
  sessionId?: string;
  message: Message;
  historyLength?: number;
  pushNotification?: PushNotificationConfig;
  metadata?: Record<string, any>;
}

export interface PushNotificationConfig {
  url: string;
  token?: string;
  authentication?: {
    scheme: string;
    credentials: string;
  };
}

export interface TaskQueryParams {
  id: string;
  historyLength?: number;
}

export interface TaskIdParams {
  id: string;
  metadata?: Record<string, any>;
}

// ============================================
// A2A JSON-RPC Types
// ============================================
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: JSONRPCError;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

// A2A Error Codes
export const A2AErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  
  // A2A Specific
  TASK_NOT_FOUND: -32001,
  TASK_NOT_CANCELABLE: -32002,
  PUSH_NOTIFICATION_NOT_SUPPORTED: -32003,
  UNAUTHORIZED: -32004,
  RATE_LIMIT_EXCEEDED: -32005,
} as const;

// ============================================
// SSE (Server-Sent Events) for Streaming
// ============================================
export interface TaskStatusUpdateEvent {
  type: 'status';
  status: TaskStatus;
  final: boolean;
}

export interface TaskArtifactUpdateEvent {
  type: 'artifact';
  artifact: Artifact;
  final: boolean;
}

export type TaskEvent = TaskStatusUpdateEvent | TaskArtifactUpdateEvent;

// ============================================
// Mycelio-specific A2A Extensions
// ============================================
export interface MycelioTaskMetadata {
  bounty: number;
  requirements: Array<{
    skill: string;
    min_level: number;
  }>;
  publisherId: string;
  solverId?: string;
  mycelioTaskId?: string;
}
