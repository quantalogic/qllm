import fs from 'fs/promises';
import { LLMResponse, OutputFormat } from '../providers/types';
import { logger } from '../utils/logger';

/**
 * Formats the LLM response based on the specified output format.
 * @param response The LLM response to format
 * @param format The desired output format
 * @returns Formatted string representation of the response
 */
export function formatOutput(response: LLMResponse, format: OutputFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(response, null, 2);
    case 'markdown':
      return `# LLM Response\n\n${response.content[0].text}`;
    case 'text':
    default:
      return response.content[0].text;
  }
}

/**
 * Writes the formatted output to a file or console.
 * @param output The formatted output string
 * @param filePath Optional file path to write the output to
 */
export async function writeOutput(output: string, filePath?: string): Promise<void> {
  if (filePath) {
    try {
      await fs.writeFile(filePath, output);
      logger.info(`Response written to ${filePath}`);
    } catch (error) {
      logger.error(`Failed to write output to file: ${error}`);
      console.error(output); // Fallback to console output
    }
  } else {
    console.log(output);
  }
}

/**
 * Formats and writes the LLM response.
 * @param response The LLM response
 * @param format The desired output format
 * @param filePath Optional file path to write the output to
 */
export async function handleOutput(response: LLMResponse, format: OutputFormat, filePath?: string): Promise<void> {
  const formattedOutput = formatOutput(response, format);
  await writeOutput(formattedOutput, filePath);
}

/**
 * Handles streaming output, writing chunks to the console or a file.
 */
export class StreamOutputHandler {
  private outputStream: fs.FileHandle | null = null;
  private buffer: string = '';

  constructor(private filePath?: string) {}

  async initialize(): Promise<void> {
    if (this.filePath) {
      try {
        this.outputStream = await fs.open(this.filePath, 'w');
      } catch (error) {
        logger.error(`Failed to open output file: ${error}`);
      }
    }
  }

  async handleChunk(chunk: string): Promise<void> {
    this.buffer += chunk;
    process.stdout.write(chunk);
    if (this.outputStream) {
      try {
        await this.outputStream.write(chunk);
      } catch (error) {
        logger.error(`Failed to write chunk to file: ${error}`);
      }
    }
  }

  async finalize(): Promise<void> {
    if (this.outputStream) {
      await this.outputStream.close();
    }
  }

  getFullResponse(): string {
    return this.buffer;
  }
}

/**
 * Creates a new StreamOutputHandler instance and initializes it.
 * @param filePath Optional file path for output
 * @returns Initialized StreamOutputHandler
 */
export async function createStreamOutputHandler(filePath?: string): Promise<StreamOutputHandler> {
  const handler = new StreamOutputHandler(filePath);
  await handler.initialize();
  return handler;
}
