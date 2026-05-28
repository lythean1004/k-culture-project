export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  jsonSchema?: object;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | { name: string };
  purpose: 'REASON_TEXT' | 'CHAT' | 'POST_EDIT' | 'INTENT';
}

export interface ChatCompletionResponse {
  content: string;
  toolCalls?: ToolCall[];
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  provider: string;
  modelName: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: object;     // JSON Schema
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: any;
}
