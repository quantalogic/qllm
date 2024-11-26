/**
 * @fileoverview Slack Message Streaming Tool
 * This module provides functionality to stream messages to Slack channels
 * with support for threading and rich message formatting.
 * @module slack-streamer
 */

import { WebClient, ChatPostMessageResponse } from "@slack/web-api";
import { BaseTool, ToolDefinition } from "./base-tool";

/**
 * @interface SlackMessage
 * @description Represents a message to be sent to Slack
 */
interface SlackMessage {
  /** Message text content */
  text: string;
  /** Optional thread timestamp */
  thread_ts?: string;
  /** Optional message blocks */
  blocks?: any[];
  /** Optional attachments */
  attachments?: any[];
}

/**
 * @interface SlackConfig
 * @description Configuration options for Slack streamer
 */
interface SlackConfig {
  /** Default Slack token */
  defaultToken?: string;
  /** Rate limiting delay (ms) */
  rateLimitDelay?: number;
  /** Retry attempts */
  maxRetries?: number;
}

/**
 * @class SlackStreamerTool
 * @extends BaseTool
 * @description A tool for streaming messages to Slack channels with rich formatting
 */
export class SlackStreamerTool extends BaseTool {
  private client: WebClient | null = null;
  private rateLimitDelay: number;
  private maxRetries: number;
  private defaultToken: string | null;

  /**
   * @constructor
   * @param {SlackConfig} config - Slack configuration options
   */
  constructor(config: SlackConfig = {}) {
    super(config);
    this.rateLimitDelay = config.rateLimitDelay || 1000;
    this.maxRetries = config.maxRetries || 3;
    this.defaultToken = config.defaultToken || null;
  }

  /**
   * @method getDefinition
   * @returns {ToolDefinition} Tool definition
   */
  getDefinition(): ToolDefinition {
    return {
      name: 'slack-streamer',
      description: 'Streams messages to Slack with rich formatting support',
      input: {
        token: { 
          type: 'string', 
          required: !this.defaultToken, 
          description: 'Slack Bot Token' 
        },
        channel: { 
          type: 'string', 
          required: true, 
          description: 'Channel ID or name' 
        },
        message: { 
          type: 'string', 
          required: true, 
          description: 'Message content' 
        },
        thread_ts: { 
          type: 'string', 
          required: false, 
          description: 'Thread timestamp' 
        },
        blocks: {
          type: 'array',
          required: false,
          description: 'Slack Block Kit blocks'
        },
        attachments: {
          type: 'array',
          required: false,
          description: 'Message attachments'
        }
      },
      output: { 
        type: 'object', 
        description: 'Message response including timestamp and channel' 
      }
    };
  }

  /**
   * @private
   * @method initializeClient
   * @param {string} token - Slack API token
   */
  private initializeClient(token: string): void {
    this.client = new WebClient(token, {
      retryConfig: {
        retries: this.maxRetries
      }
    });
  }

  /**
   * @private
   * @method validateInputs
   * @param {Record<string, any>} inputs - Input parameters
   * @throws {Error} If validation fails
   */
  private validateInputs(inputs: Record<string, any>): void {
    const token = inputs.token || this.defaultToken;
    if (!token) {
      throw new Error('Slack token is required');
    }
    if (!inputs.channel) {
      throw new Error('Channel is required');
    }
    if (!inputs.message && !inputs.blocks) {
      throw new Error('Message or blocks are required');
    }
  }

  /**
   * @private
   * @method formatMessage
   * @param {Record<string, any>} inputs - Message inputs
   * @returns {SlackMessage} Formatted message object
   */
  private formatMessage(inputs: Record<string, any>): SlackMessage {
    const message: SlackMessage = {
      text: inputs.message
    };

    if (inputs.thread_ts) {
      message.thread_ts = inputs.thread_ts;
    }
    if (inputs.blocks) {
      message.blocks = inputs.blocks;
    }
    if (inputs.attachments) {
      message.attachments = inputs.attachments;
    }

    return message;
  }

  /**
   * @method execute
   * @async
   * @param {Record<string, any>} inputs - Input parameters
   * @returns {Promise<ChatPostMessageResponse>} Slack API response
   * @throws {Error} If message sending fails
   */
  async execute(inputs: Record<string, any>): Promise<ChatPostMessageResponse> {
    try {
      this.validateInputs(inputs);
      
      const token = inputs.token || this.defaultToken;
      if (!this.client) {
        this.initializeClient(token);
      }

      const message = this.formatMessage(inputs);
      const response = await this.client!.chat.postMessage({
        channel: inputs.channel,
        ...message
      });

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

      return response;
    } catch (error) {
      console.error('Error sending Slack message:', error);
      throw new Error(`Failed to send Slack message: ${error}`);
    }
  }
}