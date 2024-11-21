// src/tools/slack-streamer.tool.ts
import { WebClient } from "@slack/web-api";
import { BaseTool, ToolDefinition } from "./base-tool";

export class SlackStreamerTool extends BaseTool {
  private client: WebClient | null = null;

  getDefinition(): ToolDefinition {
    return {
      name: 'slack-streamer',
      description: 'Streams messages to Slack',
      input: {
        token: { type: 'string', required: true, description: 'Slack Bot Token' },
        channel: { type: 'string', required: true, description: 'Channel ID or name' },
        message: { type: 'string', required: true, description: 'Message content' },
        thread_ts: { type: 'string', required: false, description: 'Thread timestamp' }
      },
      output: { type: 'string', description: 'Message ID' }
    };
  }

  async execute(inputs: Record<string, any>) {
    if (!this.client) {
      this.client = new WebClient(inputs.token);
    }
    const response = await this.client.chat.postMessage({
      channel: inputs.channel,
      text: inputs.message,
      thread_ts: inputs.thread_ts
    });
    return response.ts;
  }
}