import fs from "fs/promises";
import path from "path";
import { Command } from "commander";
import { getLLMProvider, ChatMessage, LLMProvider } from "qllm-lib";
import { createSpinner, Spinner } from "nanospinner";
import kleur from "kleur";
import {
  AskCommandOptions,
  AskCommandOptionsPartialSchema,
  PartialAskCommandOptions,
} from "../types/ask-command-options";
import Clipboard from "../utils/clipboard";
import { ScreenshotCapture } from "../utils/screenshot";
import {
  readImageFileAndConvertToBase64,
  isImageFile,
} from "../utils/image-utils";
import { output } from "../utils/output";
import { processAndExit } from "../utils/common";
import { validateOptions } from "../utils/validate-options";
import { IOManager } from "../chat/io-manager";
import { CliConfigManager } from "../utils/cli-config-manager";
import { DEFAULT_PROVIDER, DEFAULT_MODEL } from "../constants";

const askCommandAction = async (
  question: string,
  options: AskCommandOptions
) => {
  let validOptions: PartialAskCommandOptions = options;

  try {
    // validate use zod schema
    validOptions = await validateOptions(
      AskCommandOptionsPartialSchema,
      options,
      new IOManager()
    );
  } catch (error) {
    if (error instanceof Error) {
      output.error(
        `An error occurred while validating the options: ${error.message}`
      );
      process.exit(1);
    }
  }

  const cliConfig = CliConfigManager.getInstance();

  const providerName =
    validOptions.provider ||
    cliConfig.get("defaultProvider") ||
    DEFAULT_PROVIDER;
  const modelName =
    validOptions.model || cliConfig.get("defaultModel") || DEFAULT_MODEL;

  const spinner = createSpinner("Processing...").start();

  try {
    spinner.update({ text: "Connecting to provider..." });
    const provider = await getLLMProvider(providerName);

    spinner.update({ text: "Preparing input..." });
    const imageInputs = await prepareImageInputs({
      image: options.image || [],
      useClipboard: options.useClipboard || false,
      screenshot: options.screenshot,
    });

    spinner.update({ text: "Sending request..." });

    const usedOptions: AskCommandOptions = {
      ...validOptions,
      image: imageInputs,
      provider: providerName,
      model: modelName,
    };

    // console.dir(usedOptions, { depth: null });

    const response = await askQuestion(
      spinner,
      question,
      provider,
      usedOptions
    );

    spinner.success({ text: kleur.green("response received successfully!") });

    if (options.output) {
      await saveResponseToFile(response, options.output);
      output.success(`Response saved to ${options.output}`);
    } else {
      output.info("Response:");
      console.log(response);
    }
  } catch (error) {
    spinner.error({
      text: kleur.red("An error occurred while processing your request."),
    });
    output.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
  }
};

export const askCommand = new Command("ask")
  .description("Ask a question to an LLM provider")
  .argument("<question>", "The question to ask")
  .option("-p, --provider <provider>", "LLM provider to use", "openai")
  .option("-m, --model <model>", "Specific model to use")
  .option(
    "-t, --max-tokens <number>",
    "Maximum number of tokens to generate",
    (value) => parseInt(value, 10),
    1024
  )
  .option(
    "--temperature <number>",
    "Temperature for response generation",
    (value) => parseFloat(value),
    0.7
  )
  .option("-s, --stream", "Stream the response", false)
  .option("-o, --output <file>", "Output file for the response")
  .option(
    "--system-message <message>",
    "System message to prepend to the conversation"
  )
  .option(
    "-i, --image <path>",
    "Path to image file, or URL (can be used multiple times)",
    (value, previous) => previous.concat([value]),
    [] as string[]
  )
  .option("--use-clipboard", "Use image from clipboard", false)
  .option(
    "--screenshot <display>",
    "Capture screenshot from specified display number",
    (value) => parseInt(value, 10)
  )
  .action(processAndExit(askCommandAction));

interface ImageInputOptions {
  image: string[];
  useClipboard: boolean;
  screenshot?: number;
}

async function prepareImageInputs({
  image,
  useClipboard,
  screenshot,
}: ImageInputOptions): Promise<string[]> {
  const images: string[] = [];

  if (screenshot !== undefined) {
    try {
      const screenshotCapture = new ScreenshotCapture();
      await screenshotCapture.initialize();
      const screenshotBase64 = await screenshotCapture.captureAndGetBase64(
        screenshot
      );
      images.push(screenshotBase64);
      output.success(
        `Screenshot captured successfully from display ${screenshot}`
      );
    } catch (error) {
      output.error(
        `Failed to capture screenshot from display ${screenshot}: ${error}`
      );
    }
  }

  for (const item of image) {
    try {
      if (await isImageFile(item)) {
        const base64Image = await readImageFileAndConvertToBase64(item);
        images.push(base64Image);
        output.success(`Image loaded successfully: ${item}`);
      } else {
        // Assume it's a URL
        images.push(item);
        output.success(`Image URL added: ${item}`);
      }
    } catch (error) {
      output.error(`Failed to process image input ${item}: ${error}`);
    }
  }

  if (useClipboard) {
    try {
      output.info("Checking clipboard for images...");
      const clipboardImage = await Clipboard.getImageFromClipboard();
      if (clipboardImage) {
        images.push(clipboardImage);
        output.success(
          `Image found in clipboard, size ${formatBytes(
            clipboardImage.length
          )} bytes`
        );
      } else {
        output.warn("No image found in clipboard.");
      }
    } catch (error) {
      output.error(`Failed to get image from clipboard: ${error}`);
    }
  }

  return images;
}

function formatBytes(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

async function askQuestion(
  spinner: Spinner,
  question: string,
  provider: LLMProvider,
  options: AskCommandOptions
): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: "user",
      content: createMessageContent(question, options.image || []),
    },
  ];

  const params = {
    messages,
    options: {
      systemMessage: options.systemMessage,
      model: options.model,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    },
  };

  if (options.stream) {
    return streamResponse(spinner, provider, params);
  } else {
    const response = await provider.generateChatCompletion(params);
    return response.text || "No response generated.";
  }
}

function createMessageContent(
  question: string,
  images: string[]
): ChatMessage["content"] {
  const content: ChatMessage["content"] = [{ type: "text", text: question }];

  for (const image of images) {
    content.push({
      type: "image_url",
      url: image, // Url can be a local file path, URL, or base64 string
    });
  }

  return content;
}

async function streamResponse(
  spinner: Spinner,
  provider: LLMProvider,
  params: any
): Promise<string> {
  const chunks: string[] = [];

  let chunkNumber = 0;

  spinner.update({ text: "Waiting response..." });

  try {
    const stream = await provider.streamChatCompletion(params);
    for await (const chunk of stream) {
      if (chunkNumber === 0) {
        spinner.update({ text: "" });
        spinner.stop();
      }

      if (chunk.text) {
        process.stdout.write(chunk.text);
        chunks.push(chunk.text);
      }
      chunkNumber++;
    }
    console.log(); // New line after streaming
    return chunks.join("");
  } catch (error) {
    throw error;
  }
}

async function saveResponseToFile(
  response: string,
  outputPath: string
): Promise<void> {
  try {
    const directory = path.dirname(outputPath);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(outputPath, response, "utf-8");
  } catch (error) {
    throw new Error(`Failed to save response to file: ${error}`);
  }
}
