// packages/qllm-cli/src/chat/message-handler.ts
import {
  ConversationManager,
  LLMProvider,
  ConversationMessage,
} from "qllm-lib";
import { createSpinner } from "nanospinner";
import { output } from "../utils/output";
import { DEFAULT_PROVIDER, DEFAULT_MODEL, DEFAULT_MAX_TOKENS } from "../constants";
import { ConfigManager } from "./config-manager";

export class MessageHandler {
  constructor(
    private conversationManager: ConversationManager,
    private configManager: ConfigManager
  ) {}

  async addUserMessage(conversationId: string, message: string): Promise<void> {
    const config = this.configManager.getConfig();
    await this.conversationManager.addMessage(conversationId, {
      role: "user",
      content: {
        type: "text",
        text: message,
      },
      providerId: config.getProvider() || DEFAULT_PROVIDER,
      options: {
        model: config.getModel() || DEFAULT_MODEL,
        temperature: config.getTemperature(),
        maxTokens: config.getMaxTokens() ,
        topProbability: config.getTopP(),
        frequencyPenalty: config.getFrequencyPenalty(),
        presencePenalty: config.getPresencePenalty(),
        stop: config.getStopSequence(),
      },
    });
  }

  async generateAndSaveResponse(
    provider: LLMProvider,
    messages: ConversationMessage[],
    conversationId: string
  ): Promise<void> {
    const spinner = createSpinner("Generating response...").start();

    if (messages.length === 0) {
      spinner.error({
        text: "No messages to generate a response from.",
      });
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const options = lastMessage.options;

    let chunkNumber = 0;
    try {
      let fullResponse = "";
      for await (const chunk of provider.streamChatCompletion({
        messages,
        options: {
          model: options?.model || DEFAULT_MODEL,
          temperature: options?.temperature || 0.7,
          maxTokens: options?.maxTokens || 150,
          topProbability: options?.topProbability || 1,
          frequencyPenalty: options?.frequencyPenalty || 0,
          presencePenalty: options?.presencePenalty || 0,
          stop: options?.stop || undefined,
        },
      })) {
        if (chunkNumber === 0) {
          spinner.stop();
          process.stdout.write("\r\x1b[K"); // Clear the entire line
          spinner.clear();
          output.info("\nAssistant: ");
        }
        if (chunk.text) {
          process.stdout.write(chunk.text);
          fullResponse += chunk.text;
        }
        chunkNumber++;
      }
      console.log("\n");
      await this.saveResponse(
        conversationId,
        fullResponse,
        provider.name
      );
    } catch (error) {
      spinner.error({
        text: `Error generating response: ${(error as Error).message}`,
      });
    }
  }

  private async saveResponse(
    conversationId: string,
    response: string,
    providerId: string
  ): Promise<void> {
    await this.conversationManager.addMessage(conversationId, {
      role: "assistant",
      content: {
        type: "text",
        text: response,
      },
      providerId,
    });
  }

  async addImage(
    conversationId: string,
    imageUrl: string,
    providerId: string
  ): Promise<void> {
    const spinner = createSpinner("Processing image...").start();
    try {
      await this.conversationManager.addMessage(conversationId, {
        role: "user",
        content: [
          {
            type: "image_url",
            url: imageUrl,
          },
        ],
        providerId,
      });
      spinner.success({ text: "Image added to the conversation." });
    } catch (error) {
      spinner.error({
        text: `Failed to add image: ${(error as Error).message}`,
      });
    }
  }
}
