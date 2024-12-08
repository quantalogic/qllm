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

    // Try using RAG tool first if available
    const ragTool = this.context.tools.get('rag_search');
    console.log("===== ragTool : ", ragTool)

    if (ragTool) {
      try {
        const result = await ragTool.execute({ query: message });
        console.log("===== result : ", result)


        if (result.response) {
          const messages: ChatMessage[] = [{
            role: 'user',
            content: { 
              type: 'text', 
              text: `Using context: ${result.response}, answer: ${message}` 
            }
          }];

          const response = await this.provider.generateChatCompletion({
            messages,
            options: {
              ...this.config.llmOptions,
              systemMessage: this.buildSystemPrompt()
            }
          });

          console.log("response : ", response)

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
      } catch (error) {
        console.error('RAG tool execution failed:', error);
      }
    }

    // Fallback to regular chat
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

  async *streamChat(message: string): AsyncGenerator<string> {
    const ragTool = this.context.tools.get('rag_search');
    if (ragTool) {
      try {
        yield "Searching documents...\n";
        const result = await ragTool.execute({ query: message });
        
        if (result.response) {
          for await (const chunk of this.provider.streamChatCompletion({
            messages: [{
              role: 'user',
              content: { 
                type: 'text', 
                text: `Using context: ${result.response}, answer: ${message}` 
              }
            }],
            options: {
              ...this.config.llmOptions,
              systemMessage: this.buildSystemPrompt()
            }
          })) {
            if (chunk.text) {
              yield chunk.text;
              if (this.config.memory) {
                this.context.messages.push({
                  role: 'assistant',
                  content: { type: 'text', text: chunk.text }
                });
              }
            }
          }
          return;
        }
      } catch (error) {
        yield `Error searching documents: ${error}\n`;
      }
    }

    // Fallback to regular streaming
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
  }

  protected buildSystemPrompt(): string {
    const toolDescriptions = Array.from(this.context.tools.values())
      .map(tool => `- ${tool.name}: ${tool.description}`)
      .join('\n');

    const sys_prompt =`
Role: ${this.config.role}
Goal: ${this.config.goal}
Backstory: ${this.config.backstory}
Available Tools: ${toolDescriptions}
${this.config.systemPrompt || ''}
    `.trim(); 

    console.log("sys_prompt : ", sys_prompt)
    return sys_prompt
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
}