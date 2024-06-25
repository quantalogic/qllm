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
import { MODEL_ID, AWS_PROFILE, AWS_REGION } from './config';
import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';

// Load environment variables
dotenv.config();

const program = new Command();

// Global options
program
  .version('1.0.0')
  .description('LLM Command CLI')
  .option('-p, --profile <profile>', 'AWS profile to use', process.env.AWS_PROFILE || AWS_PROFILE)
  .option('-r, --region <region>', 'AWS region to use', process.env.AWS_REGION || AWS_REGION)
  .option('-m, --model <model>', 'Model ID to use', process.env.MODEL_ID || MODEL_ID);

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
      messages: messages
    });
    spinner.stop(true);
    console.log('Response generated');
    return message;
  } catch (error) {
    spinner.stop(true);
    console.error('Failed to generate response');
    throw error;
  }
}


// Helper function to format output
function formatOutput(message: any, format: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify(message, null, 2);
    case 'markdown':
      return `# LLM Response\n\n${message.content}`;
    default:
      return message.content;
  }
}

// Helper function to write output
async function writeOutput(output: string, filePath: string | undefined): Promise<void> {
  if (filePath) {
    await fs.writeFile(filePath, output);
    console.log(`Response written to ${filePath}`);
  } else {
    console.log(output);
  }
}

// Ask command
program
  .command('ask')
  .description('Ask a question to the LLM')
  .argument('<question>', 'The question to ask')
  .addOption(maxTokensOption)
  .addOption(temperatureOption)
  .addOption(topPOption)
  .addOption(topKOption)
  .addOption(systemOption)
  .addOption(fileOption)
  .addOption(outputOption)
  .addOption(formatOption)
  .action(async (question, options, command) => {
    try {
      const credentials = await getCredentials();
      const client = createAnthropicClient(credentials);
      let input = question;
      if (options.file) {
        input = await fs.readFile(options.file, 'utf-8');
      }

      const messages = [];
      if (options.system) {
        messages.push({ role: 'system', content: options.system });
      }

      messages.push({ role: 'user', content: input });
      const message = await createMessage(client, { ...options, ...command.optsWithGlobals() }, messages);
      const output = formatOutput(message, options.format);
      await writeOutput(output, options.output);
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });

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
      if (options.system) {
        messages.push({ role: 'system', content: options.system });
      }

      console.log('Starting chat session. Type "exit" to end the session.');
      while (true) {
        const response = await prompts({
          type: 'text',
          name: 'input',
          message: 'You:',
        });

        if (response.input.toLowerCase() === 'exit') {
          break;
        }

        messages.push({ role: 'user', content: response.input });
        const message = await createMessage(client, { ...options, ...command.optsWithGlobals() }, messages);
        console.log('LLM:', message.content);
        messages.push({ role: 'assistant', content: message.content });
      }

      console.log('Chat session ended.');
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });

// Stream command
program
  .command('stream')
  .description('Stream a response from the LLM')
  .argument('<question>', 'The question to ask')
  .addOption(maxTokensOption)
  .addOption(temperatureOption)
  .addOption(topPOption)
  .addOption(topKOption)
  .addOption(systemOption)
  .addOption(fileOption)
  .addOption(outputOption)
  .addOption(formatOption)
  .action(async (question, options, command) => {
    try {
      const credentials = await getCredentials();
      const client = createAnthropicClient(credentials);
      let input = question;
      if (options.file) {
        input = await fs.readFile(options.file, 'utf-8');
      }

      const messages = [];
      if (options.system) {
        messages.push({ role: 'system', content: options.system });
      }

      messages.push({ role: 'user', content: input });
      const formattedMessages = messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }));
      const stream = client.messages.stream({
        model: command.optsWithGlobals().model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        top_p: options.topP,
        top_k: options.topK,
        messages: formattedMessages
      });
      console.log('Streaming response:');
      let fullResponse = '';
      stream.on('text', (text) => {
        process.stdout.write(text);
        fullResponse += text;
      });
      await stream.finalMessage();
      console.log(); // Add a newline after the stream ends
      if (options.output) {
        const output = formatOutput({ content: fullResponse }, options.format);
        await writeOutput(output, options.output);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  });

// Config command
program
  .command('config')
  .description('Display or update configuration')
  .option('-s, --show', 'Show current configuration')
  .option('--set-profile <profile>', 'Set AWS profile')
  .option('--set-region <region>', 'Set AWS region')
  .option('--set-model <model>', 'Set model ID')
  .action(async (options) => {
    if (options.show) {
      console.log('Current configuration:');
      console.log(`AWS Profile: ${process.env.AWS_PROFILE || AWS_PROFILE}`);
      console.log(`AWS Region: ${process.env.AWS_REGION || AWS_REGION}`);
      console.log(`Model ID: ${process.env.MODEL_ID || MODEL_ID}`);
    } else if (options.setProfile || options.setRegion || options.setModel) {
      const envPath = path.resolve(__dirname, '../.env');
      let envContent = await fs.readFile(envPath, 'utf-8');
      if (options.setProfile) {
        envContent = envContent.replace(/AWS_PROFILE=.*/, `AWS_PROFILE=${options.setProfile}`);
      }
      if (options.setRegion) {
        envContent = envContent.replace(/AWS_REGION=.*/, `AWS_REGION=${options.setRegion}`);
      }
      if (options.setModel) {
        envContent = envContent.replace(/MODEL_ID=.*/, `MODEL_ID=${options.setModel}`);
      }
      await fs.writeFile(envPath, envContent);
      console.log('Configuration updated. Please restart the CLI for changes to take effect.');
    } else {
      console.log('Use --help to see available options for config command.');
    }
  });

// Save history command
program
  .command('save-history')
  .description('Save conversation history to a file')
  .argument('<file>', 'File to save history to')
  .action(async (file) => {
    // Implement saving conversation history
    console.log(`Saving conversation history to ${file}`);
    // This is a placeholder. You'll need to implement the actual saving logic.
  });

// Load history command
program
  .command('load-history')
  .description('Load conversation history from a file')
  .argument('<file>', 'File to load history from')
  .action(async (file) => {
    // Implement loading conversation history
    console.log(`Loading conversation history from ${file}`);
    // This is a placeholder. You'll need to implement the actual loading logic.
  });

program.parse(process.argv);
