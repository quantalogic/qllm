import { JSONSchemaType } from 'openai/lib/jsonschema';
import { MemoryOptions } from '../types';
import { ChatMessage, LLMOptions } from '../types/llm-types';

export interface KnowledgeHandler {
  search(query: string): Promise<string[]>;
  add(documents: string[]): Promise<void>;
  delete(documentIds: string[]): Promise<void>;
  update(documentId: string, content: string): Promise<void>;
}

export interface AgentConfig {
  // Existing fields
  role: string;
  goal: string;
  backstory: string;
  llmOptions: LLMOptions;
  memoryOptions?: MemoryOptions;
  
  // New fields
  tools?: AgentTool[];
  toolChoice?: 'none' | 'auto' | 'required';
  maxIterations?: number;
  maxExecutionTime?: number;
  allowDelegation?: boolean;
  memory?: boolean;
  verbose?: boolean;
  cacheEnabled?: boolean;
  knowledgeSources?: KnowledgeSource[];
  systemPrompt?: string;
}

export interface KnowledgeSource {
  type: 'rag' | 'graph' | 'vector' | 'hybrid';
  config: Record<string, any>;
  handler: KnowledgeHandler;
}

export interface AgentContext {
  messages: ChatMessage[];
  memory: Map<string, any>;
  tools: Map<string, AgentTool>;
}

export interface AgentToolkit {
  name: string;
  description: string;
  tools: AgentTool[];
}

export interface AgentToolResult {
  success: boolean;
  output: any;
  error?: string;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: JSONSchemaType;
  execute: (inputs: Record<string, any>) => Promise<any>;
  streamExecute?: (inputs: Record<string, any>) => AsyncGenerator<any>;
  cacheEnabled?: boolean;
  metadata?: Record<string, any>;
}

export interface ToolExecutionResult {
  success: boolean;
  output: any;
  error?: string;
}