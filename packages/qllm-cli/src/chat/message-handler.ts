// packages/qllm-cli/src/chat/message-handler.ts
import { ConversationManager, LLMProvider, ChatMessage } from "qllm-lib";
import { createSpinner } from "nanospinner";
import { output } from "../utils/output";
import { DEFAULT_PROVIDER } from "../constants";

export class MessageHandler {
  constructor(private conversationManager: ConversationManager) {}

  async addUserMessage(
    conversationId: string,
    message: string,
    providerId: string
  ): Promise<void> {
    await this.conversationManager.addMessage(conversationId, {
      role: "user",
      content: {
        type: "text",
        text: message,
      },
      providerId: providerId || DEFAULT_PROVIDER,
    });
  }

  async generateAndSaveResponse(
    provider: LLMProvider,
    messages: ChatMessage[],
    conversationId: string,
    options: Record<string, any>
  ): Promise<void> {
    const spinner = createSpinner("Generating response...").start();
    let chunkNumber = 0;
    try {
      let fullResponse = "";
      for await (const chunk of provider.streamChatCompletion({
        messages,
        options: {
          model: options.model,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          topProbability: options.topP,
          frequencyPenalty: options.frequencyPenalty,
          presencePenalty: options.presencePenalty,
          stop: options.stopSequence,
        },
      })) {
        if (chunkNumber === 0) {
          spinner.stop();
          process.stdout.write('\r\x1b[K'); // Clear the entire line
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
      await this.saveResponse(conversationId, fullResponse, options.provider || DEFAULT_PROVIDER);
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