import { WebClient } from "@slack/web-api";
import { BaseTool, ToolDefinition } from "./base-tool";

export class SlackStreamerTool extends BaseTool {
    private client: WebClient;
  
    constructor(token: string) {
      super();
      this.client = new WebClient(token);
    }
  
    getDefinition(): ToolDefinition {
      return {
        name: 'slack-streamer',
        description: 'Streams messages to Slack',
        input: {
          channel: { type: 'string', required: true, description: 'Channel ID or name' },
          message: { type: 'string', required: true, description: 'Message content' },
          thread_ts: { type: 'string', required: false, description: 'Thread timestamp' }
        },
        output: {
          messageId: { type: 'string', description: 'Sent message ID' }
        }
      };
    }
  
    async execute(inputs: Record<string, any>) {
      const response = await this.client.chat.postMessage({
        channel: inputs.channel,
        text: inputs.message,
        thread_ts: inputs.thread_ts
      });
      return { messageId: response.ts };
    }
  }