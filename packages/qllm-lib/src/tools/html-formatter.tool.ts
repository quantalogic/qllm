import { BaseTool, ToolDefinition } from "./base-tool";

export class HtmlFormatterTool extends BaseTool {
    getDefinition(): ToolDefinition {
      return {
        name: 'html-formatter',
        description: 'Formats content as HTML',
        input: {
          content: { type: 'string', required: true, description: 'Content to format' },
          template: { type: 'string', required: false, description: 'HTML template' }
        },
        output: {
          html: { type: 'string', description: 'Formatted HTML content' }
        }
      };
    }
  
    async execute(inputs: Record<string, any>) {
      const template = inputs.template || '<div class="content">{{content}}</div>';
      const html = template.replace('{{content}}', inputs.content);
      return { html };
    }
  }