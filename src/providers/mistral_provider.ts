import MistralClient from "@mistralai/mistralai";
import {
  LLMProvider,
  LLMProviderOptions,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
} from "./llm_provider";
import { Message } from "./types";
import { providerRegistry } from "./provider_registry";
import { DEFAULT_MAX_TOKENS } from "../config/default";

export class MistralProvider implements LLMProvider {
  private client: MistralClient;

  constructor(private options: LLMProviderOptions) {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error("Mistral API key not found in environment variables");
    }
    this.client = new MistralClient(apiKey);
  }

  async generateMessage(
    messages: Message[],
    options: LLMProviderOptions
  ): Promise<string> {
    try {
      const messageWithSystem = this.withSystemMessage(options, messages);
      const completion = await this.client.chat({
        model: options.model || this.options.model || "mistral-small-latest",
        messages: messageWithSystem,
        maxTokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        topP: options.topP,
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamMessage(
    messages: Message[],
    options: LLMProviderOptions
  ): AsyncIterableIterator<string> {
    try {
      const messageWithSystem = this.withSystemMessage(options, messages);
      const stream = await this.client.chatStream({
        model: options.model || this.options.model || "mistral-small-latest",
        messages: messageWithSystem,
        maxTokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        topP: options.topP,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private withSystemMessage(
    options: LLMProviderOptions,
    messages: Message[]
  ): Message[] {
    return options.system && options.system.length > 0
      ? [{ role: "system", content: options.system }, ...messages]
      : messages;
  }

  private handleError(error: any): never {
    if (error instanceof Error) {
      if (error.message.includes("401")) {
        throw new AuthenticationError(
          "Authentication failed with Mistral",
          "Mistral"
        );
      } else if (error.message.includes("429")) {
        throw new RateLimitError("Rate limit exceeded for Mistral", "Mistral");
      } else {
        throw new InvalidRequestError(
          `Mistral request failed: ${error.message}`,
          "Mistral"
        );
      }
    }
    throw new InvalidRequestError(`Unexpected error: ${error.message}`, "Mistral");
  }
}

export function register() {
  // Register the Mistral provider
  providerRegistry.registerProvider(
    "mistral",
    (options) => new MistralProvider(options)
  );
}
