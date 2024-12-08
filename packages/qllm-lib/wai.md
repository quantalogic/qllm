# Table of Contents
- src/agents/agent-loader.ts
- src/agents/index.ts
- src/agents/agent-manager.ts
- src/agents/agent-builder.ts
- src/agents/base-agent.ts
- src/agents/agent-types.ts
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
- Size: 180 bytes
- Created: 2024-12-08 21:09:45
- Modified: 2024-12-08 21:09:45

### Code

```typescript

// New agent exports
export * from './base-agent';
export * from './agent-manager';
export * from './agent-types';
export * from './agent-loader';
export * from './agent-builder';
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
- Size: 2027 bytes
- Created: 2024-12-08 21:09:45
- Modified: 2024-12-08 21:09:45

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
  
      if (!this.config.llmOptions) {
        this.config.llmOptions = {
            model:"gpt-4o-mini",
        };
      }
  
      return new Agent(this.config as AgentConfig, this.provider);
    }
  }
```

## File: src/agents/base-agent.ts

- Extension: .ts
- Language: typescript
- Size: 4674 bytes
- Created: 2024-12-08 21:09:45
- Modified: 2024-12-08 21:09:45

### Code

```typescript
import {  ChatMessage, ChatCompletionParams, ChatCompletionResponse } from '../types/llm-types';
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
    
    // Initialize tools if provided
    if (config.tools) {
      config.tools.forEach(tool => {
        this.context.tools.set(tool.name, tool);
      });
    }
  }

  async executeTool(toolName: string, inputs: Record<string, any>): Promise<any> {
    const tool = this.context.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    return tool.execute(inputs);
  }

  private extractResponseText(response: ChatCompletionResponse): string {
    // If response has text content
    if (response.text) {
      return response.text;
    }
    
    // If response has refusal
    if (response.refusal) {
      return `Refusal: ${response.refusal}`;
    }

    // Handle other cases
    return 'No response generated';
  }

  async chat(message: string): Promise<string> {
    const startTime = Date.now();
    let iterations = 0;

    while (iterations < this.maxIterations) {
      if (Date.now() - startTime > this.maxExecutionTime * 1000) {
        throw new Error('Execution time limit exceeded');
      }

      const messages: ChatMessage[] = [
        ...this.getContextMessages(),
        { role: 'user', content: { type: 'text', text: message } }
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
      
        // Handle the response based on your ChatCompletionResponse type
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
    return `
Role: ${this.config.role}
Goal: ${this.config.goal}
Backstory: ${this.config.backstory}

Available Tools:
${Array.from(this.context.tools.keys()).map(tool => `- ${tool}`).join('\n')}

${this.config.systemPrompt || ''}
    `.trim();
  }

  private getContextMessages(): ChatMessage[] {
    if (!this.config.memory) return [];
    return this.context.messages.slice(-5); // Keep last 5 messages for context
  }

  async addTool(tool: AgentTool): Promise<void> {
    this.context.tools.set(tool.name, tool);
  }

  async removeTool(toolName: string): Promise<boolean> {
    return this.context.tools.delete(toolName);
  }


  async *streamChat(message: string): AsyncGenerator<string> {
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
            
            // Store in context if memory is enabled
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
- Size: 1540 bytes
- Created: 2024-12-08 21:16:59
- Modified: 2024-12-08 21:16:59

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
  cacheEnabled?: boolean;
  metadata?: Record<string, any>;
}

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

