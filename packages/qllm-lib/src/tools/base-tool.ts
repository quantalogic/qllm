// src/tools/base-tool.ts
export interface ToolDefinition {
    name: string;
    description: string;
    input: Record<string, {
      type: string;
      required: boolean;
      description: string;
    }>;
    output: Record<string, {
      type: string;
      description: string;
    }>;
  }
  
  export abstract class BaseTool {
    abstract execute(inputs: Record<string, any>): Promise<Record<string, any>>;
    abstract getDefinition(): ToolDefinition;
  }