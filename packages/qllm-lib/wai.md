# Table of Contents
- src/agents/agent-loader.ts
- src/agents/index.ts
- src/agents/agent-manager.ts
- src/agents/agent-builder.ts
- src/agents/base-agent.ts
- src/agents/agent-types.ts
- src/agents/tools/rag-search.ts
- src/agents/tools/index.ts
- src/agents/templates/default-agent.yaml

## File: src/agents/agent-loader.ts

- Extension: .ts
- Language: typescript
- Size: 1065 bytes
- Created: 2024-12-08 21:09:45
- Modified: 2024-12-08 21:09:45

### Code

```typescript
import { readFile } from 'fs/promises';
import { load } from 'js-yaml';
import { Agent } from './base-agent'; 
import { LLMProvider } from '../types'; 

export class AgentLoader {
  async loadFromYaml(path: string, provider: LLMProvider): Promise<Agent> {
    const content = await readFile(path, 'utf-8');
    const config = load(content) as any;
    
    return new Agent({
      role: config.name,
      goal: config.description,
      backstory: config.description,
      llmOptions: {
        ...config.model.parameters,
        model: config.model.name,
        systemMessage: this.processSystemPrompt(
          config.system_prompt,
          config.role,
          config.goal,
          config.backstory
        ),
        streaming: true // Enable streaming by default
      }
    }, provider);
  }

  private processSystemPrompt(
    template: string,
    role: string,
    goal: string,
    backstory: string
  ): string {
    return template
      .replace('{role}', role)
      .replace('{goal}', goal)
      .replace('{backstory}', backstory);
  }
}
```

## File: src/agents/index.ts

- Extension: .ts
- Language: typescript
- Size: 204 bytes
- Created: 2024-12-08 22:03:01
- Modified: 2024-12-08 22:03:01

### Code

```typescript

// New agent exports
export * from './base-agent';
export * from './agent-manager';
export * from './agent-types';
export * from './agent-loader';
export * from './agent-builder';
export * from "./tools"
```

## File: src/agents/agent-manager.ts

- Extension: .ts
- Language: typescript
- Size: 1653 bytes
- Created: 2024-12-08 21:09:45
- Modified: 2024-12-08 21:09:45

### Code

```typescript
import { LLMProvider } from '../types'; 
import { Agent } from './base-agent';
import { AgentConfig } from './agent-types';
import * as yaml from 'js-yaml';
import * as fs from 'fs/promises';
import * as path from 'path';

export class AgentManager {
  private agents: Map<string, Agent> = new Map();

  constructor(
    private provider: LLMProvider,
    private templatesPath?: string
  ) {
    this.templatesPath = templatesPath || path.join(__dirname, 'templates');
  }

  async *streamChat(name: string, message: string): AsyncGenerator<string> {
    const agent = this.getAgent(name);
    if (!agent) {
      throw new Error(`Agent ${name} not found`);
    }

    for await (const chunk of agent.streamChat(message)) {
      yield chunk;
    }
  }

  async createAgent(name: string, config: AgentConfig): Promise<Agent> {
    const agent = new Agent(config, this.provider);
    this.agents.set(name, agent);
    return agent;
  }

  async loadTemplate(templateName: string): Promise<AgentConfig> {
    const templatePath = path.join(this.templatesPath!, `${templateName}.yaml`);
    const content = await fs.readFile(templatePath, 'utf-8');
    return yaml.load(content) as AgentConfig;
  }

  async createFromTemplate(
    name: string, 
    templateName: string, 
    overrides: Partial<AgentConfig> = {}
  ): Promise<Agent> {
    const template = await this.loadTemplate(templateName);
    const config = { ...template, ...overrides };
    return this.createAgent(name, config);
  }

  getAgent(name: string): Agent | undefined {
    return this.agents.get(name);
  }

  listAgents(): string[] {
    return Array.from(this.agents.keys());
  }
}
```

## File: src/agents/agent-builder.ts

- Extension: .ts
- Language: typescript
- Size: 2112 bytes
- Created: 2024-12-08 22:24:01
- Modified: 2024-12-08 22:24:01

### Code

```typescript
import { LLMOptions, LLMProvider } from "../types";
import { AgentConfig, AgentTool } from "./agent-types";
import { Agent } from "./base-agent";

export class AgentBuilder {
    private config: Partial<AgentConfig> = {};
    private provider?: LLMProvider; 
    private tools: AgentTool[] = [];
  
    static create(init: {
      role: string;
      goal: string;
      backstory: string;
    }): AgentBuilder {
      const builder = new AgentBuilder();
      builder.config = { ...init };
      return builder;
    }
  
    withLLMOptions(options: LLMOptions): AgentBuilder {
      this.config.llmOptions = {
        ...this.config.llmOptions,
        ...options
      };
      return this;
    }
  
    withTool(tool: AgentTool): AgentBuilder {
      if (!this.config.tools) {
        this.config.tools = [];
      }
      this.config.tools.push(tool);
      return this;
    }
  
    withTools(tools: AgentTool[]): AgentBuilder {
      if (!this.config.tools) {
        this.config.tools = [];
      }
      this.config.tools.push(...tools);
      return this;
    }
  
    withMemory(enabled: boolean): AgentBuilder {
      this.config.memory = enabled;
      return this;
    }
  
    withMaxIterations(iterations: number): AgentBuilder {
      this.config.maxIterations = iterations;
      return this;
    }
  
    withMaxExecutionTime(seconds: number): AgentBuilder {
      this.config.maxExecutionTime = seconds;
      return this;
    }
  
    withSystemPrompt(prompt: string): AgentBuilder {
      this.config.systemPrompt = prompt;
      return this;
    }
  
    withProvider(provider: LLMProvider): AgentBuilder {
      this.provider = provider;
      return this;
    }
    
    build(): Agent {
      if (!this.provider) {
        throw new Error('Provider must be set before building the agent');
      }
      
      return new Agent({
        ...this.config,
        tools: this.config.tools || [], // Currently using this.tools instead of config.tools
        llmOptions: this.config.llmOptions || {
          model: "gpt-4o-mini",
        }
      } as AgentConfig, this.provider);
    }
  }
```

## File: src/agents/base-agent.ts

- Extension: .ts
- Language: typescript
- Size: 6407 bytes
- Created: 2024-12-08 22:37:00
- Modified: 2024-12-08 22:37:00

### Code

```typescript
import { ChatMessage, ChatCompletionParams, ChatCompletionResponse } from '../types/llm-types';
import { LLMProvider } from '../types';
import { AgentConfig, AgentContext, AgentTool } from './agent-types';

export class Agent {
  protected context: AgentContext;
  private maxIterations: number;
  private maxExecutionTime: number;

  constructor(
    protected config: AgentConfig,
    protected provider: LLMProvider
  ) {
    this.context = {
      messages: [],
      memory: new Map(),
      tools: new Map()
    };
    this.maxIterations = config.maxIterations || 20;
    this.maxExecutionTime = config.maxExecutionTime || 300;

    if (config.tools) {
      config.tools.forEach(tool => {
        this.context.tools.set(tool.name, tool);
      });
    }
  }

  protected async shouldUseTool(message: string): Promise<boolean> {
    const toolNames = Array.from(this.context.tools.keys());
    if (!toolNames.length) return false;
    
    const response = await this.provider.generateChatCompletion({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Should I use one of these tools: ${toolNames.join(', ')} to answer: "${message}"? Reply with just "yes" or "no"`
        }
      }],
      options: { ...this.config.llmOptions }
    });
    
    return response.text?.toLowerCase().includes('yes') ?? false;
  }

  async executeTool(toolName: string, inputs: Record<string, any>): Promise<any> {
    const tool = this.context.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    return tool.execute(inputs);
  }

  private extractResponseText(response: ChatCompletionResponse): string {
    if (response.text) {
      return response.text;
    }
    if (response.refusal) {
      return `Refusal: ${response.refusal}`;
    }
    return 'No response generated';
  }

  async chat(message: string): Promise<string> {
    const startTime = Date.now();
    let iterations = 0;

    if (await this.shouldUseTool(message)) {
      const tool = this.context.tools.get('rag_search');
      if (tool) {
        const result = await tool.execute({ query: message });
        if (result.response) {
          const response = await this.provider.generateChatCompletion({
            messages: [{
              role: 'user',
              content: {
                type: 'text',
                text: `Based on this context: ${result.response}, answer: ${message}`
              }
            }],
            options: this.config.llmOptions
          });
          return this.extractResponseText(response);
        }
      }
    }

    while (iterations < this.maxIterations) {
      if (Date.now() - startTime > this.maxExecutionTime * 1000) {
        throw new Error('Execution time limit exceeded');
      }

      const messages: ChatMessage[] = [
        ...this.getContextMessages(),
        {
          role: 'user',
          content: { type: 'text', text: message }
        }
      ];

      const params: ChatCompletionParams = {
        messages,
        options: {
          ...this.provider.defaultOptions,
          ...this.config.llmOptions,
          systemMessage: this.buildSystemPrompt()
        }
      };

      const response = await this.provider.generateChatCompletion(params);
      const responseText = this.extractResponseText(response);

      if (this.config.memory) {
        this.context.messages = messages;
        this.context.messages.push({
          role: 'assistant',
          content: { type: 'text', text: responseText }
        });
      }

      return responseText;
    }
    throw new Error('Maximum iterations exceeded');
  }

  protected buildSystemPrompt(): string {
    const toolDescriptions = Array.from(this.context.tools.values())
      .map(tool => `- ${tool.name}: ${tool.description}`)
      .join('\n');

    return `
Role: ${this.config.role}
Goal: ${this.config.goal}
Backstory: ${this.config.backstory}
Available Tools: ${toolDescriptions}
${this.config.systemPrompt || ''}
    `.trim();
  }

  private getContextMessages(): ChatMessage[] {
    if (!this.config.memory) return [];
    return this.context.messages.slice(-5);
  }

  async addTool(tool: AgentTool): Promise<void> {
    this.context.tools.set(tool.name, tool);
  }

  async removeTool(toolName: string): Promise<boolean> {
    return this.context.tools.delete(toolName);
  }

  async *streamChat(message: string): AsyncGenerator<string> {
    if (await this.shouldUseTool(message)) {
      const tool = this.context.tools.get('rag_search');
      if (tool) {
        const result = await tool.execute({ query: message });
        if (result.response) {
          for await (const chunk of this.provider.streamChatCompletion({
            messages: [{
              role: 'user',
              content: {
                type: 'text',
                text: `Based on this context: ${result.response}, answer: ${message}`
              }
            }],
            options: this.config.llmOptions
          })) {
            if (chunk.text) {
              yield chunk.text;
            }
          }
          return;
        }
      }
    }

    const startTime = Date.now();
    let iterations = 0;

    while (iterations < this.maxIterations) {
      if (Date.now() - startTime > this.maxExecutionTime * 1000) {
        throw new Error('Execution time limit exceeded');
      }

      const messages: ChatMessage[] = [
        ...this.getContextMessages(),
        {
          role: 'user',
          content: { type: 'text', text: message }
        }
      ];

      const params: ChatCompletionParams = {
        messages,
        options: {
          ...this.provider.defaultOptions,
          ...this.config.llmOptions,
          systemMessage: this.buildSystemPrompt()
        }
      };

      try {
        for await (const chunk of this.provider.streamChatCompletion(params)) {
          if (chunk.text) {
            yield chunk.text;
            if (this.config.memory) {
              this.context.messages = messages;
              this.context.messages.push({
                role: 'assistant',
                content: { type: 'text', text: chunk.text }
              });
            }
          }
        }
        return;
      } catch (error) {
        iterations++;
        if (iterations >= this.maxIterations) {
          throw error;
        }
      }
    }
  }
}
```

## File: src/agents/agent-types.ts

- Extension: .ts
- Language: typescript
- Size: 1706 bytes
- Created: 2024-12-08 22:36:33
- Modified: 2024-12-08 22:36:33

### Code

```typescript
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
```

## File: src/agents/tools/rag-search.ts

- Extension: .ts
- Language: typescript
- Size: 4809 bytes
- Created: 2024-12-08 22:39:01
- Modified: 2024-12-08 22:39:01

### Code

```typescript
import { 
  OpenAI,
  Settings,
  SimpleDirectoryReader,
  VectorStoreIndex,
  HuggingFaceEmbedding,
  OpenAIEmbedding,
  HuggingFaceEmbeddingParams
} from 'llamaindex';
import { AgentTool } from '../agent-types';
import { JSONSchemaType } from 'openai/lib/jsonschema';

interface RAGToolConfig {
  query: string;
  topK?: number;
}

export class RAGTool implements AgentTool {
  name: string;
  description: string;
  parameters: JSONSchemaType = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query to find relevant information'
      },
      topK: {
        type: 'number',
        description: 'Number of top results to return'
      }
    },
    required: ['query']
  };

  private queryEngine: any;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(
    private directory: string,
    private config: {
      embedModel?: {
        type: 'openai' | 'huggingface';
        options: Record<string, any>;
      };
      name?: string;
      description?: string;
      similarityTopK?: number;
      cacheEnabled?: boolean;
    } = {}
  ) {
    this.name = config.name || 'rag_search';
    this.description = config.description || `Search through documents in ${directory} using RAG`;
    
    this.config = {
      ...config,
      embedModel: config.embedModel || {
        type: 'huggingface',
        options: {
          modelType: 'BAAI/bge-small-en-v1.5',
          quantized: false
        }
      },
      similarityTopK: config.similarityTopK || 3,
      cacheEnabled: config.cacheEnabled ?? true
    };
  }

  private async initializeOnce(): Promise<void> {
    if (this.initialized) return;
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.initialize();
    await this.initializationPromise;
    this.initialized = true;
  }

  private async initialize(): Promise<void> {
    try {
      if (this.config.embedModel?.type === 'openai') {
        Settings.embedModel = new OpenAIEmbedding(this.config.embedModel.options);
      } else {
        const huggingFaceParams: HuggingFaceEmbeddingParams = {
          modelType: 'BAAI/bge-small-en-v1.5',
          ...this.config.embedModel?.options
        };
        Settings.embedModel = new HuggingFaceEmbedding(huggingFaceParams);
      }

      const reader = new SimpleDirectoryReader();
      const documents = await reader.loadData(this.directory);
      const index = await VectorStoreIndex.fromDocuments(documents);
      
      const retriever = await index.asRetriever({
        similarityTopK: this.config.similarityTopK
      });
      
      this.queryEngine = await index.asQueryEngine({
        retriever
      });
    } catch (error) {
      this.initialized = false;
      this.initializationPromise = null;
      throw new Error(`Failed to initialize RAG tool: ${error}`);
    }
  }

  async execute(inputs: Record<string, any>): Promise<any> {
    try {
      await this.initializeOnce();

      const response = await this.queryEngine.query({
        query: inputs.query,
        similarityTopK: inputs.topK || this.config.similarityTopK
      });

      if (!response || !response.response) {
        return {
          success: false,
          error: 'No relevant information found'
        };
      }

      return {
        success: true,
        response: response.response,
        sources: response.sourceNodes?.map((node: any) => ({
          content: node.text,
          score: node.score || 0,
          metadata: node.metadata
        })) || []
      };
    } catch (error) {
      return {
        success: false,
        error: error
      };
    }
  }

  async *streamExecute(inputs: Record<string, any>): AsyncGenerator<any> {
    try {
      yield { type: 'status', message: 'Initializing RAG search...' };
      await this.initializeOnce();

      yield { type: 'status', message: 'Searching documents...' };
      const response = await this.queryEngine.query({
        query: inputs.query,
        similarityTopK: inputs.topK || this.config.similarityTopK
      });

      if (response.sourceNodes?.length > 0) {
        yield {
          type: 'sources',
          data: response.sourceNodes.map((node: any) => ({
            content: node.text,
            score: node.score || 0,
            metadata: node.metadata
          }))
        };
      }

      if (response.response) {
        yield {
          type: 'response',
          data: response.response
        };
      } else {
        yield {
          type: 'error',
          message: 'No relevant information found'
        };
      }
    } catch (error) {
      yield {
        type: 'error',
        message: error
      };
    }
  }
}
```

## File: src/agents/tools/index.ts

- Extension: .ts
- Language: typescript
- Size: 29 bytes
- Created: 2024-12-08 22:02:46
- Modified: 2024-12-08 22:02:46

### Code

```typescript

export * from "./rag-search"
```

## File: src/agents/templates/default-agent.yaml

- Extension: .yaml
- Language: yaml
- Size: 614 bytes
- Created: 2024-12-08 21:09:45
- Modified: 2024-12-08 21:09:45

### Code

```yaml
name: research_assistant
version: 1.0.0
description: An AI research assistant
system_prompt: |
  You are an AI assistant with the following characteristics:
  Role: {role}
  Goal: {goal}
  Backstory: {backstory}
  Instructions:
  1. Use your expertise to provide accurate and helpful responses
  2. Maintain conversation context
  3. Use available tools when appropriate
  4. Stay focused on your assigned role and goal
  5. Provide clear and structured responses

model:
  provider: openai
  name: gpt-4o-mini
  parameters:
    max_tokens: 1000
    temperature: 0.7
    top_p: 1
    top_k: 250
    streaming: true
```

