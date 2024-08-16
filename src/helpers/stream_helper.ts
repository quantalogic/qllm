import { Spinner } from '../utils/spinner';
import { LLMProviderOptions, Message } from '../providers/types';
import { LLMProvider } from '../providers/llm_provider';
import { logger } from '../utils/logger';
import { ErrorManager } from '../utils/error_handler';

/**
 * Handles streaming of LLM responses with a spinner for user feedback.
 * @param provider The LLM provider instance
 * @param messages The array of messages to send to the LLM
 * @param options The options for the LLM provider
 * @returns A Promise that resolves to the full response string
 */
export async function handleStreamWithSpinner(
  provider: LLMProvider,
  messages: Message[],
  options: LLMProviderOptions
): Promise<string> {
  const spinner = new Spinner('Generating response...');
  let fullResponse = '';
  let isFirstChunk = true;

  try {
    spinner.start();

    for await (const chunk of provider.streamMessage(messages, options)) {
      if (isFirstChunk) {
        spinner.stop();
        isFirstChunk = false;
      }
      process.stdout.write(chunk);
      fullResponse += chunk;
    }

    spinner.succeed('Response generated');
    console.log(); // Add a newline after the response
    return fullResponse;
  } catch (error) {
    spinner.fail('Error during streaming');
    ErrorManager.handleError('StreamingError', error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    if (spinner.isActive()) {
      spinner.stop();
    }
  }
}

/**
 * Creates a stream output handler for writing chunks to a file or console.
 * @param outputStream The output stream to write to (optional)
 * @returns An object with methods to handle streaming output
 */
export function createStreamOutputHandler(outputStream?: NodeJS.WritableStream) {
  let buffer = '';

  return {
    handleChunk: (chunk: string) => {
      buffer += chunk;
      process.stdout.write(chunk);
      if (outputStream) {
        outputStream.write(chunk);
      }
    },
    finalize: async () => {
      if (outputStream && outputStream !== process.stdout) {
        await new Promise<void>((resolve) => {
          outputStream.end(() => {
            logger.info('Output stream closed');
            resolve();
          });
        });
      }
    },
    getFullResponse: () => buffer,
  };
}

/**
 * Handles streaming with both spinner and output handling.
 * @param provider The LLM provider instance
 * @param messages The array of messages to send to the LLM
 * @param options The options for the LLM provider
 * @param outputHandler The output handler for managing streamed content
 * @returns A Promise that resolves to the full response string
 */
export async function handleStreamWithSpinnerAndOutput(
  provider: LLMProvider,
  messages: Message[],
  options: LLMProviderOptions,
  outputHandler: ReturnType<typeof createStreamOutputHandler>
): Promise<string> {
  const spinner = new Spinner('Generating response...');
  let isFirstChunk = true;

  try {
    spinner.start();

    for await (const chunk of provider.streamMessage(messages, options)) {
      if (isFirstChunk) {
        spinner.stop();
        isFirstChunk = false;
      }
      outputHandler.handleChunk(chunk);
    }

    spinner.succeed('Response generated');
    console.log(); // Add a newline after the response
    return outputHandler.getFullResponse();
  } catch (error) {
    spinner.fail('Error during streaming');
    ErrorManager.handleError('StreamingError', error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    if (spinner.isActive()) {
      spinner.stop();
    }
    await outputHandler.finalize();
  }
}