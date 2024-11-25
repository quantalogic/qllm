import { BaseTool, ToolDefinition } from "./base-tool";

export class HtmlFormatterTool extends BaseTool {
  constructor(config: Record<string, any> = {}) {
    super(config);
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'html-formatter',
      description: 'Formats content as HTML',
      input: {
        content: { type: 'string', required: true, description: 'Content to format' },
        template: { type: 'string', required: false, description: 'HTML template' }
      },
      output: { type: 'string', description: 'Formatted HTML content' }
    };
  }

  async execute(inputs: Record<string, any>) {
    const template = inputs.template || '<div class="content">{{content}}</div>';
    return template.replace('{{content}}', inputs.content);
  }
}