import fs from 'fs/promises';
import path from 'path';
import { Command } from 'commander';
import { getLLMProvider, ChatMessage, LLMProvider, ChatCompletionResponse } from 'qllm-lib';
import { createSpinner, Spinner } from 'nanospinner';
import kleur from 'kleur';

interface AskOptions {
  provider: string;
  model: string;
  maxTokens: number;
  temperature: number;
  stream: boolean;
  output: string | undefined;
  systemMessage: string | undefined;
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
    const spinner = createSpinner('Processing...').start();
    try {
      const provider = await getLLMProvider(options.provider);
      spinner.update({ text: 'Thinking...' });
      const response = await askQuestion(spinner,question, provider, options);
      spinner.start();
      spinner.success({ text: kleur.green('Response received!') });

      if (options.output) {
        await saveResponseToFile(response, options.output);
        console.log(kleur.green(`Response saved to ${options.output}`));
      } else {
        console.log(kleur.cyan('Response:'));
        console.log(response);
      }
    } catch (error) {
      spinner.error({ text: kleur.red('An error occurred') });
      console.error(kleur.red('Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

async function askQuestion(spinner: Spinner, question: string, provider: LLMProvider, options: AskOptions): Promise<string> {
  const messages: ChatMessage[] = [];

  messages.push({
    role: 'user',
    content: { type: 'text', text: question },
  });

  const params = {
    messages,
    options: {
      systemMessage: options.systemMessage,
      model: options.model,
      maxTokens: parseInt(options.maxTokens.toString(), 10),
      temperature: parseFloat(options.temperature.toString()),
    },
  };

  if (options.stream) {
    spinner.stop();
    spinner.clear();
    return streamResponse(provider, params);
  } else {
    const response = await provider.generateChatCompletion(params);
    return response.text || 'No response generated.';
  }
}

async function streamResponse(provider: LLMProvider, params: any): Promise<string> {
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
    return chunks.join('');
  } catch (error) {
    throw error;
  }
}

async function saveResponseToFile(response: string, outputPath: string): Promise<void> {
  const directory = path.dirname(outputPath);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(outputPath, response, 'utf-8');
}