import fs from "fs/promises";
import path from "path";
import { Command } from "commander";
import { getLLMProvider, ChatMessage, LLMProvider } from "qllm-lib";
import { createSpinner, Spinner } from "nanospinner";
import kleur from "kleur";

interface AskOptions {
  provider: string;
  model: string;
  maxTokens: number;
  temperature: number;
  stream: boolean;
  output: string | undefined;
  systemMessage: string | undefined;
}

export const askCommand = new Command("ask")
  .description("Ask a question to an LLM provider")
  .argument("<question>", "The question to ask")
  .option("-p, --provider <provider>", "LLM provider to use", "openai")
  .option("-m, --model <model>", "Specific model to use")
  .option(
    "-t, --max-tokens <number>",
    "Maximum number of tokens to generate",
    (value) => parseInt(value, 10), // Convert to integer
    1024 // Default value
  )
  .option(
    "--temperature <number>",
    "Temperature for response generation",
    (value) => parseFloat(value), // Convert to float
    0.7 // Default value
  )
  .option("-s, --stream", "Stream the response", false)
  .option("-o, --output <file>", "Output file for the response")
  .option(
    "--system-message <message>",
    "System message to prepend to the conversation"
  )
  .action(async (question: string, options: AskOptions) => {
    const spinner = createSpinner("Processing...").start();
    const startTime = Date.now();

    try {
      spinner.update({ text: "Connecting to provider..." });
      const provider = await getLLMProvider(options.provider);

      spinner.update({ text: "Sending request..." });
      const response = await askQuestion(spinner, question, provider, options);

      const duration = Date.now() - startTime;
      if (duration < 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1000 - duration)); // Ensure spinner is visible for at least 1 second
      }

      spinner.success({ text: kleur.green("Response received successfully!") });

      if (options.output) {
        await saveResponseToFile(response, options.output);
        console.log(kleur.green(`Response saved to ${options.output}`));
      } else {
        console.log(kleur.cyan("Response:"));
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

async function askQuestion(
  spinner: Spinner,
  question: string,
  provider: LLMProvider,
  options: AskOptions
): Promise<string> {
  // Validate options
  if (options.maxTokens < 1 || options.maxTokens > 4096) {
    throw new Error("maxTokens must be between 1 and 4096.");
  }
  if (options.temperature < 0 || options.temperature > 1) {
    throw new Error("Temperature must be between 0 and 1.");
  }

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: { type: "text", text: question },
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

  // Stream or generate response
  if (options.stream) {
    spinner.stop(); // Stop the spinner before streaming
    spinner.clear();
    return streamResponse(provider, params);
  } else {
    const response = await provider.generateChatCompletion(params);
    return response.text || "No response generated.";
  }
}

async function streamResponse(
  provider: LLMProvider,
  params: any
): Promise<string> {
  const chunks: string[] = [];

  try {
    const stream = await provider.streamChatCompletion(params);
    let chunkCount = 0;

    for await (const chunk of stream) {
      chunkCount++;
      if (chunk.text) {
        process.stdout.write(chunk.text);
        chunks.push(chunk.text);
      }
      // Update output without overwriting previous text
      if (chunk.text) {
        process.stdout.write(`\rReceiving response... (${chunkCount} chunks received)`);
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
