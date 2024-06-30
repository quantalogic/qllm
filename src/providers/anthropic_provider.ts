import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import { LLMProvider, LLMProviderOptions, AuthenticationError, RateLimitError, InvalidRequestError } from './llm_provider';
import { Message } from './types';
import { AwsCredentialIdentity } from "@aws-sdk/types";


export const DEFAULT_MAX_TOKENS = 1024;

export class AnthropicProvider implements LLMProvider {
  private client: AnthropicBedrock;

  constructor(private credentials: AwsCredentialIdentity,private awsRegion: string, private model: string) {
    console.log('credentials', JSON.stringify(this.credentials, null, 2));
    console.log(`AWS region: ${awsRegion}`);
    this.client = new AnthropicBedrock({
      awsAccessKey: this.credentials.accessKeyId,
      awsSecretKey: this.credentials.secretAccessKey,
      awsSessionToken: this.credentials.sessionToken,
      awsRegion: this.awsRegion,
    });
  }

  async generateMessage(messages: Message[], options: LLMProviderOptions): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: options.model || this.model,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topP,
        top_k: options.topK,
        system: options.system,
        messages: messages.map(msg => ({ role: msg.role as "user" | "assistant", content: msg.content })),
      });

      return response.content && response.content.length > 0 && response.content[0].type === 'text'
        ? response.content[0].text
        : '';
    } catch (error) {
      this.handleError(error);
    }
  }

  async *streamMessage(messages: Message[], options: LLMProviderOptions): AsyncIterableIterator<string> {
    try {
      const stream = this.client.messages.stream({
        model: options.model || this.model,
        max_tokens: options.maxTokens || DEFAULT_MAX_TOKENS,
        temperature: options.temperature,
        top_p: options.topP,
        top_k: options.topK,
        system: options.system,
        messages: messages.map(msg => ({ role: msg.role as "user" | "assistant", content: msg.content })),
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          const contentBlockDelta = chunk as { type: 'content_block_delta', delta: { text: string } };
          yield contentBlockDelta.delta.text || '';
        }
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any): never {
    if (error.status === 401) {
      throw new AuthenticationError('Authentication failed with Anthropic', 'Anthropic');
    } else if (error.status === 429) {
      throw new RateLimitError('Rate limit exceeded for Anthropic', 'Anthropic');
    } else {
      throw new InvalidRequestError(`Anthropic request failed: ${error.message}`, 'Anthropic');
    }
  }
}