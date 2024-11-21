import { writeFile } from "fs";
import { BaseTool, ToolDefinition } from "./base-tool";

export class FileSaverTool extends BaseTool {
    getDefinition(): ToolDefinition {
      return {
        name: 'file-saver',
        description: 'Saves content to local file',
        input: {
          path: { type: 'string', required: true, description: 'File path' },
          content: { type: 'string', required: true, description: 'Content to save' },
          encoding: { type: 'string', required: false, description: 'File encoding' }
        },
        output: {
          path: { type: 'string', description: 'Saved file path' }
        }
      };
    }
  
    async execute(inputs: Record<string, any>) {
      await writeFile(inputs.path, inputs.content, inputs.encoding || 'utf-8');
      return { path: inputs.path };
    }
  }