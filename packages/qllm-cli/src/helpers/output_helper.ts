import fs from 'fs/promises';

import { logger } from '@qllm/lib/common/utils/logger';
import { OutputFormat, LLMResponse } from '@qllm/types/src';

/**
 * Formats the LLM response based on the specified output format.
 * @param response The LLM response to format
 * @param format The desired output format
 * @returns Formatted string representation of the response
 */
/* export function formatOutput(
  response: LLMResponse,
  format: OutputFormat
): string {
  switch (format) {
    case "json":
      return JSON.stringify(response, null, 2);
    case "markdown":
      return `# LLM Response\n\n${response.content[0].text}`;
    case "text":
    default:
      return response.content[0].text;
  }
} */

export function formatOutput(
  response: LLMResponse | { content: Array<{ text?: string; embedding?: number[] }> },
  format: OutputFormat,
): string {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(response, null, 2);
    case 'markdown':
      if ('text' in response.content[0]) {
        return `# LLM Response\n\n${response.content[0].text}`;
      } else if ('embedding' in response.content[0]) {
        return `# Embedding\n\n\`\`\`json\n${JSON.stringify(response.content[0].embedding)}\n\`\`\``;
      }
      return '# No content';
    case 'text':
    default:
      if ('text' in response.content[0]) {
        return response.content[0].text || '';
      } else if ('embedding' in response.content[0]) {
        return JSON.stringify(response.content[0].embedding);
      }
      return 'No content';
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
