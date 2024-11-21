// src/tools/file-saver.tool.ts
import { writeFile } from "fs/promises";
import { BaseTool, ToolDefinition } from "./base-tool";

export class FileSaverTool extends BaseTool {
  constructor(config: Record<string, any> = {}) {
    super(config);
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'file-saver',
      description: 'Saves content to local file',
      input: {
        path: { type: 'string', required: true, description: 'File path' },
        content: { type: 'string', required: true, description: 'Content to save' },
        encoding: { type: 'string', required: false, description: 'File encoding' }
      },
      output: { type: 'string', description: 'Saved file path' }
    };
  }

  async execute(inputs: Record<string, any>) {
    await writeFile(inputs.path, inputs.content, inputs.encoding || 'utf-8');
    return inputs.path;
  }
}
