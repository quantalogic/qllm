import { Spinner } from '../utils/spinner';
import { LLMProviderOptions, Message } from '../providers/types';
import { LLMProvider } from '../providers/llm_provider';
import { log } from 'console';
import { logger } from '../utils/logger';

export async function handleStreamWithSpinner(
  provider: LLMProvider,
  messages: Message[],
  options: LLMProviderOptions
): Promise<string> {
  const spinner = new Spinner('Waiting for response...');
  spinner.start();

  let fullResponse = '';
  let isFirstChunk = true;

  try {
    for await (const chunk of provider.streamMessage(messages, options)) {
      if (isFirstChunk) {
        spinner.stop();
        isFirstChunk = false;
      }
      process.stdout.write(chunk);
      fullResponse += chunk;
    }
  } catch (error) {
    spinner.fail('Error during streaming');
    logger.error(`Error during streaming: ${error}`);
    throw error;
  }

  console.log(); // Add a newline after the response
  return fullResponse;
}
