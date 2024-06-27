#!/usr/bin/env node
import { Command } from 'commander';
import dotenv from 'dotenv';
import { createAskCommand } from './commands/ask';
import { createConfigCommand } from './commands/config';
import { createStreamCommand } from './commands/stream';
import { createChatCommand } from './commands/chat';

// Load environment variables
dotenv.config();

const program = new Command();

// Global options
program
    .version('1.0.0')
    .description('LLM Command CLI')
    .option('-p, --profile <profile>', 'AWS profile to use', process.env.AWS_PROFILE)
    .option('-r, --region <region>', 'AWS region to use', process.env.AWS_REGION)
    .option('--modelid <modelid>', 'Specific model ID to use')
    .option('--model <model>', 'Model alias to use');

// Register commands
program.addCommand(createAskCommand());
program.addCommand(createConfigCommand());
program.addCommand(createStreamCommand());
program.addCommand(createChatCommand());

program.parse(process.argv);
