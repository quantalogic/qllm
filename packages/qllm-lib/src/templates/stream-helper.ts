import { ChatMessage, LLMOptions, LLMProvider } from '../types';
import { ErrorManager } from '../utils/error';
import { Spinner } from './types';

/**
 * Handles streaming of LLM responses with a spinner for user feedback.
 * @param provider The LLM provider instance
 * @param messages The array of messages to send to the LLM
 * @param options The options for the LLM provider
 * @param outputStream The output stream to write the response chunks
 * @param spinner Optional spinner for visual feedback
 * @returns A Promise that resolves to the full response string
 */
export async function handleStreamWithSpinner(
  provider: LLMProvider,
  messages: ChatMessage[],
  options: LLMOptions,
  outputStream: NodeJS.WritableStream = process.stdout,
  spinner?: Spinner,
): Promise<string> {
  const chunks: string[] = [];

  try {
    spinner?.start();

    const stream = provider.streamChatCompletion({ messages, options });

    for await (const chunk of stream) {
      if (spinner?.isSpinning()) {
        spinner.stop();
      }

      const chunkText = chunk.text;
      if (chunkText) {
        outputStream.write(chunkText);
        chunks.push(chunkText);
      }
    }

    spinner?.succeed('Response generated');
    console.log(); // Add a newline after the response
  } catch (error) {
    spinner?.fail('Error during streaming');
    ErrorManager.throwError(
      'StreamingError',
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    spinner?.stop();
  }

  return chunks.join('');
}


