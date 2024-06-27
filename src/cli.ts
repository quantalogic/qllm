#!/usr/bin/env node
// src/cli.ts
import { Command, Option } from 'commander';
import prompts from 'prompts';
import fs from 'fs/promises';
import { Spinner } from 'cli-spinner';
import path from 'path';
import dotenv from 'dotenv';
import { getCredentials } from './credentials';
import { createAnthropicClient } from './anthropic-client';
import { AWS_PROFILE, AWS_REGION, MODEL_ALIASES, DEFAULT_MODEL_ALIAS, resolveModel } from './config';
import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import { logInfo, logError } from './utils';

// Load environment variables
dotenv.config();

const program = new Command();

// Global options
program
  .version('1.0.0')
  .description('LLM Command CLI')
  .option('-p, --profile <profile>', 'AWS profile to use', process.env.AWS_PROFILE || AWS_PROFILE)
  .option('-r, --region <region>', 'AWS region to use', process.env.AWS_REGION || AWS_REGION)
  .option('--modelid <modelid>', 'Specific model ID to use')
  .option('--model <model>', 'Model alias to use');

// Shared options for LLM interactions
const maxTokensOption = new Option('-t, --max-tokens <number>', 'Maximum number of tokens to generate')
  .default(256)
  .argParser(parseInt);

const temperatureOption = new Option('--temperature <number>', 'Temperature for response generation')
  .default(0.7)
  .argParser(parseFloat);

const topPOption = new Option('--top-p <number>', 'Top P for response generation')
  .default(1)
  .argParser(parseFloat);

const topKOption = new Option('--top-k <number>', 'Top K for response generation')
  .default(250)
  .argParser(parseInt);

const systemOption = new Option('-s, --system <message>', 'System message to set context');

const fileOption = new Option('-f, --file <path>', 'Path to input file');

const outputOption = new Option('-o, --output <path>', 'Path to output file');

const formatOption = new Option('--format <format>', 'Output format (json, markdown, text)')
  .choices(['json', 'markdown', 'text'])
  .default('text');

// Helper function to create a message
async function createMessage(client: AnthropicBedrock, options: any, messages: any[]): Promise<any> {
  const spinner = new Spinner('Generating response... %s');
  spinner.setSpinnerString('|/-\\');
  spinner.start();

  try {
    const message = await client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      top_p: options.topP,
      top_k: options.topK,
      system: options.system,
      messages: messages
    });
    spinner.stop(true);
    logInfo('Response generated');
    return message;
  } catch (error) {
    spinner.stop(true);
    logError('Failed to generate response');
    throw error;
  }
}

// Helper function to format output
function formatOutput(message: any, format: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify(message, null, 2);
    case 'markdown':
      return `# LLM Response\n\n${message.content[0].text}`;
    default:
      return message.content[0].text;
  }
}

// Helper function to write output
async function writeOutput(output: string, filePath: string | undefined): Promise<void> {
  if (filePath) {
    await fs.writeFile(filePath, output);
    logInfo(`Response written to ${filePath}`);
  } else {
    console.log(output);
  }
}

// Ask command
program
  .command('ask')
  .description('Ask a question to the LLM')
  .option('--model <model>', 'Model alias to use')
  .addOption(maxTokensOption)
  .addOption(temperatureOption)
  .addOption(topPOption)
  .addOption(topKOption)
  .addOption(systemOption)
  .addOption(fileOption)
  .addOption(outputOption)
  .addOption(formatOption)
  .allowExcessArguments(true)
  .action(async (options, command) => {
    try {
      const credentials = await getCredentials();
      const client = createAnthropicClient(credentials);

      let input;
      if (options.file) {
        input = await fs.readFile(options.file, 'utf-8');
      } else {
        // Join all remaining arguments as the question
        input = command.args.join(' ');
      }

      if (!input) {
        logError('No question provided. Please provide a question or use the --file option.');
        return;
      }

      const messages = [];
      if (options.system) {
        messages.push({ role: 'system', content: options.system });
      }
      messages.push({ role: 'user', content: input });

      const globalOptions = command.optsWithGlobals();
      const resolvedModel = resolveModel(globalOptions.modelid, options.model || globalOptions.model);
      logInfo(`Using model: ${resolvedModel}`);

      const message = await createMessage(client, { ...options, ...globalOptions, model: resolvedModel }, messages);
      const output = formatOutput(message, options.format);
      await writeOutput(output, options.output);
    } catch (error) {
      logError(`An error occurred: ${error}`);
    }
  });

// Chat command
// Chat command
program
  .command('chat')
  .description('Start an interactive chat session with the LLM')
  .addOption(maxTokensOption)
  .addOption(temperatureOption)
  .addOption(topPOption)
  .addOption(topKOption)
  .addOption(systemOption)
  .action(async (options, command) => {
    try {
      const credentials = await getCredentials();
      const client = createAnthropicClient(credentials);
      const messages = [];


      logInfo('Starting chat session. Type "exit" to end the session.');

      while (true) {
        const response = await prompts({ type: 'text', name: 'input', message: 'You:' });

        if (response.input.toLowerCase() === 'exit') {
          break;
        }

        messages.push({ role: 'user', content: response.input });

        const globalOptions = command.optsWithGlobals();
        const resolvedModel = resolveModel(globalOptions.modelid, options.model || globalOptions.model);

        logInfo(`Using model: ${resolvedModel}`);

        const stream = client.messages.stream({
          model: resolvedModel,
          max_tokens: options.maxTokens,
          temperature: options.temperature,
          top_p: options.topP,
          top_k: options.topK,
          system: options.system,
          messages: messages.map(msg => ({ role: msg.role as "user" | "assistant", content: msg.content })),
        });

        logInfo('🤖:');
        let fullResponse = '';

        stream.on('text', (text) => {
          process.stdout.write(text);
          fullResponse += text;
        });

        await stream.finalMessage();
        console.log(); // Add a newline after the stream ends

        messages.push({ role: 'assistant', content: fullResponse });
      }

      logInfo('Chat session ended.');
    } catch (error) {
      logError(`An error occurred: ${error}`);
    }
  });


// Stream command
program
  .command('stream')
  .description('Stream a response from the LLM')
  .option('--model <model>', 'Model alias to use')
  .addOption(maxTokensOption)
  .addOption(temperatureOption)
  .addOption(topPOption)
  .addOption(topKOption)
  .addOption(systemOption)
  .addOption(fileOption)
  .addOption(outputOption)
  .addOption(formatOption)
  .allowExcessArguments(true)
  .action(async (options, command) => {
    try {
      const credentials = await getCredentials();
      const client = createAnthropicClient(credentials);

      let input;
      if (options.file) {
        input = await fs.readFile(options.file, 'utf-8');
      } else {
        // Join all remaining arguments as the question
        input = command.args.join(' ');
      }

      if (!input) {
        logError('No question provided. Please provide a question or use the --file option.');
        return;
      }

      const messages = [];
      messages.push({ role: 'user', content: input });

      const formattedMessages = messages.map(msg => ({ role: msg.role as "user" | "assistant", content: msg.content }));

      const globalOptions = command.optsWithGlobals();
      const resolvedModel = resolveModel(globalOptions.modelid, options.model || globalOptions.model);
      logInfo(`Using model: ${resolvedModel}`);

      const stream = client.messages.stream({
        model: resolvedModel,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        top_p: options.topP,
        top_k: options.topK,
        system: options.system,
        messages: formattedMessages
      });

      logInfo('🤖:');
      let fullResponse = '';

      stream.on('text', (text) => {
        process.stdout.write(text);
        fullResponse += text;
      });

      await stream.finalMessage();
      console.log(); // Add a newline after the stream ends

      if (options.output) {
        const output = formatOutput({ content: [{ text: fullResponse }] }, options.format);
        await writeOutput(output, options.output);
      }
    } catch (error) {
      logError(`An error occurred: ${error}`);
    }
  });

// Config command
program
  .command('config')
  .description('Display or update configuration')
  .option('-s, --show', 'Show current configuration')
  .option('--set-profile <profile>', 'Set AWS profile')
  .option('--set-region <region>', 'Set AWS region')
  .option('--set-modelid <modelid>', 'Set specific model ID')
  .option('--set-model <model>', 'Set model alias', Object.keys(MODEL_ALIASES))
  .action(async (options) => {
    if (options.show) {
      logInfo('Current configuration:');
      logInfo(`AWS Profile: ${process.env.AWS_PROFILE || AWS_PROFILE}`);
      logInfo(`AWS Region: ${process.env.AWS_REGION || AWS_REGION}`);
      logInfo(`Model ID: ${process.env.MODEL_ID || 'Not set'}`);
      logInfo(`Available model aliases: ${Object.keys(MODEL_ALIASES).join(', ')}`);
      logInfo(`Default model alias: ${DEFAULT_MODEL_ALIAS}`);
    } else if (options.setProfile || options.setRegion || options.setModelid || options.setModel) {
      const envPath = path.resolve(__dirname, '../.env');
      let envContent = await fs.readFile(envPath, 'utf-8');

      if (options.setProfile) {
        envContent = envContent.replace(/AWS_PROFILE=.*/, `AWS_PROFILE=${options.setProfile}`);
      }
      if (options.setRegion) {
        envContent = envContent.replace(/AWS_REGION=.*/, `AWS_REGION=${options.setRegion}`);
      }
      if (options.setModelid && options.setModel) {
        logError('Cannot set both model ID and model alias. Please use only one.');
        return;
      }
      if (options.setModelid) {
        envContent = envContent.replace(/MODEL_ID=.*/, `MODEL_ID=${options.setModelid}`);
      }
      if (options.setModel) {
        const resolvedModel = MODEL_ALIASES[options.setModel as keyof typeof MODEL_ALIASES] || options.setModel;
        envContent = envContent.replace(/MODEL_ID=.*/, `MODEL_ID=${resolvedModel}`);
      }

      await fs.writeFile(envPath, envContent);
      logInfo('Configuration updated. Please restart the CLI for changes to take effect.');
    } else {
      logInfo('Use --help to see available options for config command.');
    }
  });

program.parse(process.argv);