import fs from "fs/promises";
import path from "path";
import { Command } from "commander";
import { getLLMProvider, ChatMessage, LLMProvider } from "qllm-lib";
import { createSpinner, Spinner } from "nanospinner";
import kleur from "kleur";
import { AskOptions } from "../types/ask";
import Clipboard from "../utils/clipboard";

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
    "Path to image file or URL (can be used multiple times)",
    (value, previous) => previous.concat([value]),
    [] as string[]
  )
  .option("--use-clipboard", "Use image from clipboard", "false")
  .action(async (question: string, options: AskOptions) => {
    const spinner = createSpinner("Processing...").start();
    const startTime = Date.now();

    try {
      spinner.update({ text: "Connecting to provider..." });
      const provider = await getLLMProvider(options.provider);

      spinner.update({ text: "Preparing input..." });

      const imageInputs = await prepareImageInputs(options);

      spinner.update({ text: "Sending request..." });
      const response = await askQuestion(spinner, question, provider, {
        ...options,
        image: imageInputs,
      });

      const duration = Date.now() - startTime;
      if (duration < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - duration));
      }

      spinner.success({ text: kleur.green("Response received successfully!") });

      if (options.output) {
        await saveResponseToFile(response, options.output);
        console.error(kleur.green(`Response saved to ${options.output}`));
      } else {
        console.error(kleur.cyan("Response:"));
        console.log(response);
      }
    } catch (error) {
      spinner.error({
        text: kleur.red("An error occurred while processing your request."),
      });
      console.error(
        kleur.red("Error:"),
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  });

async function prepareImageInputs(options: AskOptions): Promise<string[]> {
  const images: string[] = [...(options.image ?? [])];
  if (options.useClipboard) {
    console.log("Checking clipboard for images...");
    const x = Clipboard.getTextFromClipboard();
    const clipboardImage = await Clipboard.getImageFromClipboard();
    console.log("Clipboard image:", clipboardImage?.substring(0, 50));
    if (clipboardImage) {
      images.push(clipboardImage);
    }
  }
  return images;
}

async function askQuestion(
  spinner: Spinner,
  question: string,
  provider: LLMProvider,
  options: AskOptions
): Promise<string> {
  if (options.temperature < 0 || options.temperature > 1) {
    throw new Error("Temperature must be between 0 and 1.");
  }

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: createMessageContent(question, options.image),
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
    spinner.stop();
    spinner.clear();
    return streamResponse(provider, params);
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
      url: image, // Url can be a local file path or a URL, or a base64 string
    });
  }
  return content;
}

async function streamResponse(
  provider: LLMProvider,
  params: any
): Promise<string> {
  const chunks: string[] = [];
  try {
    const stream = await provider.streamChatCompletion(params);
    for await (const chunk of stream) {
      if (chunk.text) {
        process.stdout.write(chunk.text);
        chunks.push(chunk.text);
      }
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
  const directory = path.dirname(outputPath);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(outputPath, response, "utf-8");
}
