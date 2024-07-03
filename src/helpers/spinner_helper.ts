import { Spinner } from '../utils/spinner';
import { logger } from '../utils/logger';
import { LLMProviderError } from '../providers/llm_provider';

export async function withSpinner<T>(
  action: () => Promise<T>,
  message: string
): Promise<T> {
  const spinner = new Spinner(message);
  try {
    spinner.start();
    const result = await action();
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    if (error instanceof LLMProviderError) {
      logger.error(`${error.name}: ${error.message}`);
    } else if (error instanceof Error) {
      logger.error(`Unexpected error: ${error.message}`);
    } else {
      logger.error(`An unknown error occurred: ${error}`);
    }
    throw error;
  }
}