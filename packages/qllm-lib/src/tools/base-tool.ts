// src/tools/base-tool.ts
export interface ToolDefinition {
  name: string;
  description: string;
  input: Record<string, {
    type: string;
    required: boolean;
    description: string;
  }>;
  output: {
    type: string;
    description: string;
  };
}

export abstract class BaseTool {
  constructor(protected config: Record<string, any> = {}) {}
  abstract execute(inputs: Record<string, any>): Promise<any>;
  abstract getDefinition(): ToolDefinition;
}
