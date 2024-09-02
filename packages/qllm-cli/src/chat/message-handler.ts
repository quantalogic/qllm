// packages/qllm-cli/src/chat/message-handler.ts
import {
    ConversationManager,
    LLMProvider,
    ConversationMessage,
    ChatMessage,
    ChatMessageContent,
    MessageContent,
    ImageUrlContent,
    TextContent,
} from "qllm-lib";
import { createSpinner } from "nanospinner";
import { ioManager } from "../utils/io-manager";
import { DEFAULT_PROVIDER, DEFAULT_MODEL } from "../constants";
import { ConfigManager } from "./config-manager";

type ConversationMessageWithoutIdAndTimestamp = Omit<
    ConversationMessage,
    "id" | "timestamp"
>;

export class MessageHandler {
    constructor(
        private conversationManager: ConversationManager,
        private configManager: ConfigManager,
    ) {}

    private toUserConversationMessage(
        message: string,
        images: string[],
    ): ConversationMessageWithoutIdAndTimestamp {
        const config = this.configManager.getConfig();

        const content: ChatMessageContent =
            images.length === 0
                ? {
                      type: "text",
                      text: message,
                  }
                : [
                      {
                          type: "text",
                          text: message,
                      } as TextContent,
                      ...images.map((image) => {
                          return {
                              type: "image_url",
                              url: image,
                          } as ImageUrlContent;
                      }),
                  ];

        const conversationMessage: ConversationMessageWithoutIdAndTimestamp = {
            role: "user",
            content,
            providerId: config.getProvider() || DEFAULT_PROVIDER,
            options: {
                model: config.getModel() || DEFAULT_MODEL,
                temperature: config.getTemperature(),
                maxTokens: config.getMaxTokens(),
                topProbability: config.getTopP(),
                frequencyPenalty: config.getFrequencyPenalty(),
                presencePenalty: config.getPresencePenalty(),
                stop: config.getStopSequence(),
            },
        };

        return conversationMessage;
    }

    async generateAndSaveResponse(
        provider: LLMProvider,
        query: string,
        images: string[],
        history: ConversationMessage[],
        conversationId: string,
    ): Promise<void> {
        const spinner = createSpinner("Generating response...").start();

        const queryMessage = this.toUserConversationMessage(query, images);
        const options = queryMessage.options;

        const messages = [...history, queryMessage];

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
                    ioManager.displayInfo("\nAssistant: ");
                }
                if (chunk.text) {
                    process.stdout.write(chunk.text);
                    fullResponse += chunk.text;
                }
                chunkNumber++;
            }
            console.log("\n");
            await this.conversationManager.addMessage(
                conversationId,
                queryMessage,
            );
            await this.saveResponse(
                conversationId,
                fullResponse,
                provider.name,
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
        providerId: string,
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
        providerId: string,
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
