// src/options.ts
import { Option } from "commander";
import { ErrorManager } from "@qllm-lib/common/utils/error_manager";

/**
 * Parses a numeric value within a specified range.
 * @param value The value to parse
 * @param min The minimum allowed value
 * @param max The maximum allowed value
 * @param defaultValue The default value to use if parsing fails
 * @returns The parsed numeric value
 */
function parseNumeric(
  value: string,
  min: number,
  max: number,
  defaultValue: number
): number {
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed < min || parsed > max) {
    ErrorManager.throwError(
      "InvalidOptionError",
      `Value must be a number between ${min} and ${max}`
    );
  }
  return parsed;
}

// Option for maximum number of tokens to generate
export const maxTokensOption = new Option(
  "-t, --max-tokens <number>",
  "Maximum number of tokens to generate"
).argParser((value) => parseNumeric(value, 1, 8192, 256));

// Option for temperature in response generation
export const temperatureOption = new Option(
  "--temperature <number>",
  "Temperature for response generation"
)
  .default(0.7)
  .argParser((value) => parseNumeric(value, 0, 1, 0.7));

// Option for top P in response generation
export const topPOption = new Option(
  "--top-p <number>",
  "Top P for response generation"
)
  .default(1)
  .argParser((value) => parseNumeric(value, 0, 1, 1));

// Option for top K in response generation
export const topKOption = new Option(
  "--top-k <number>",
  "Top K for response generation"
)
  .default(250)
  .argParser((value) => parseNumeric(value, 1, 1000, 250));

// Option for system message to set context
export const systemOption = new Option(
  "-s, --system <message>",
  "System message to set context"
);

// Option for input file path
export const fileOption = new Option(
  "-f, --file <path>",
  "Path to input file"
).argParser((value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    ErrorManager.throwError(
      "InvalidOptionError",
      "File path must be a non-empty string"
    );
  }
  return value;
});

// Option for output file path
export const outputOption = new Option(
  "-o, --output <path>",
  "Path to output file"
).argParser((value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    ErrorManager.throwError(
      "InvalidOptionError",
      "Output path must be a non-empty string"
    );
  }
  return value;
});

// Option for output format
export const formatOption = new Option("--format <format>", "Output format")
  .choices(["json", "markdown", "text"])
  .default("text");

// Option for streaming output
export const streamOption = new Option("--stream", "Stream the output").default(
  false
);

export const toolsOption = new Option('--tools <tools...>', 'Tools to use for the request')
// Add these to your cliOptions object
export const imageOption = new Option('--image <path>', 'Path to an image file');
export const imageLinkOption = new Option('--image-link <url>', 'URL of an image');

// Exporting all CLI options
export const cliOptions = {
  maxTokensOption,
  temperatureOption,
  topPOption,
  topKOption,
  systemOption,
  fileOption,
  outputOption,
  formatOption,
  streamOption,
  toolsOption,
  imageOption,
  imageLinkOption
};
