import { readFile } from "fs/promises";
import { BaseTool, ToolDefinition } from "./base-tool";

export class LocalLoaderTool extends BaseTool {
  constructor(config: Record<string, any> = {}) {
    super(config);
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'local-loader',
      description: 'Loads files from local filesystem',
      input: {
        path: { type: 'string', required: true, description: 'File path' },
        encoding: { type: 'string', required: false, description: 'File encoding' }
      },
      output: { type: 'string', description: 'File content' }
    };
  }

  async execute(inputs: Record<string, any>) {
    const content = await readFile(inputs.path, inputs.encoding || 'utf-8');
    return content.toString();
  }
}