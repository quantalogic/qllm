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