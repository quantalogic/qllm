import fs from 'fs/promises';
import path from 'path';
import { Command } from 'commander';
import { getLLMProvider, ChatMessage, LLMProvider, ChatCompletionResponse } from 'qllm-lib';

interface AskOptions {
  provider: string;
  model: string;
  maxTokens: number;
  temperature: number;
  stream: boolean;
  output: string | undefined;
  systemMessage: string | undefined;
}

// Simple color formatting function
const colorize = (text: string, colorCode: number): string => {
  return `\x1b[${colorCode}m${text}\x1b[0m`;
};

const green = (text: string) => colorize(text, 32);
const cyan = (text: string) => colorize(text, 36);
const red = (text: string) => colorize(text, 31);

class SimpleSpinner {
  private spinning: boolean = false;
  private interval: NodeJS.Timeout | null = null;
  private frames: string[] = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private frameIndex: number = 0;

  start(message: string): void {
    this.spinning = true;
    process.stdout.write(message);
    this.interval = setInterval(() => {
      if (this.spinning) {
        process.stdout.write(`\r${message} ${this.frames[this.frameIndex]}`);
        this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      }
    }, 80);
  }

  stop(): void {
    this.spinning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write('\r\x1b[K');
  }
}

export const askCommand = new Command('ask')
  .description('Ask a question to an LLM provider')
  .argument('<question>', 'The question to ask')
  .option('-p, --provider <provider>', 'LLM provider to use', 'openai')
  .option('-m, --model <model>', 'Specific model to use')
  .option('-t, --max-tokens <number>', 'Maximum number of tokens to generate', '1024')
  .option('--temperature <number>', 'Temperature for response generation', '0.7')
  .option('-s, --stream', 'Stream the response', false)
  .option('-o, --output <file>', 'Output file for the response')
  .option('--system-message <message>', 'System message to prepend to the conversation')
  .action(async (question: string, options: AskOptions) => {
    try {
      const provider = await getLLMProvider(options.provider);
      const spinner = new SimpleSpinner();
      spinner.start('Generating response...');

      const response = await askQuestion(question, provider, options);

      spinner.stop();

      if (options.output) {
        await saveResponseToFile(response, options.output);
        console.log(green(`Response saved to ${options.output}`));
      } else {
        console.log(cyan('Response:'));
        console.log(response);
      }
    } catch (error) {
      console.error(red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

async function askQuestion(question: string, provider: LLMProvider, options: AskOptions): Promise<string> {
  const messages: ChatMessage[] = [];

  if (options.systemMessage) {
    messages.push({
      role: 'system',
      content: { type: 'text', text: options.systemMessage },
    });
  }

  messages.push({
    role: 'user',
    content: { type: 'text', text: question },
  });

  const params = {
    messages,
    options: {
      model: options.model,
      maxTokens: parseInt(options.maxTokens.toString(), 10),
      temperature: parseFloat(options.temperature.toString()),
    },
  };

  if (options.stream) {
    return streamResponse(provider, params);
  } else {
    const response = await provider.generateChatCompletion(params);
    return response.text || 'No response generated.';
  }
}

async function streamResponse(provider: LLMProvider, params: any): Promise<string> {
  const chunks: string[] = [];
  const stream = await provider.streamChatCompletion(params);

  for await (const chunk of stream) {
    if (chunk.text) {
      process.stdout.write(chunk.text);
      chunks.push(chunk.text);
    }
  }

  console.log(); // New line after streaming
  return chunks.join('');
}

async function saveResponseToFile(response: string, outputPath: string): Promise<void> {
  const directory = path.dirname(outputPath);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(outputPath, response, 'utf-8');
}