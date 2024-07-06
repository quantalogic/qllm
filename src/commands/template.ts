// src/commands/template.ts

import { Command } from 'commander';
import prompts from 'prompts';
import yaml from 'js-yaml';
import { templateManager } from '../templates/template_manager';
import { TemplateExecutor } from '../templates/template_executor';
import { logger } from '../utils/logger';
import { ExecutionContext, TemplateDefinition, TemplateVariable } from '../templates/types';
import { ErrorManager } from '../utils/error_manager';
import { LLMProviderOptions } from '../providers/types';
import { mergeOptions } from '../utils/option_merging';
import { configManager } from '../utils/configuration_manager';
import { cliOptions } from '../options';
import { resolveModelAlias } from '../config/model_aliases';
import { ProviderName } from '../config/types';
import { ProviderFactory } from '../providers/provider_factory';

export function createTemplateCommand(): Command {
  const templateCommand = new Command('template')
    .description('Manage and execute prompt templates')
    .addCommand(createListCommand())
    .addCommand(createCreateCommand())
    .addCommand(createExecuteCommand())
    .addCommand(createDeleteCommand())
    .addCommand(createViewCommand())
    .addCommand(createEditCommand())
    .addCommand(createVariablesCommand());

  return templateCommand;
}

function createListCommand(): Command {
  return new Command('list')
    .description('List all available templates')
    .action(async () => {
      try {
        const templates = await templateManager.listTemplates();
        console.log('Available templates:');
        templates.forEach(template => console.log(`- ${template}`));
      } catch (error) {
        ErrorManager.handleError('ListTemplatesError', `Failed to list templates: ${error}`);
      }
    });
}

function createCreateCommand(): Command {
  return new Command('create')
    .description('Create a new template')
    .action(async () => {
      try {
        const template = await promptForTemplateDetails();
        await templateManager.saveTemplate(template);
        logger.info(`Template ${template.name} created successfully`);
      } catch (error) {
        ErrorManager.handleError('CreateTemplateError', `Failed to create template: ${error}`);
      }
    });
}

function createExecuteCommand(): Command {
  return new Command('execute')
    .description('Execute a template')
    .argument('<name>', 'Name of the template to execute')
    .addOption(cliOptions.maxTokensOption)
    .addOption(cliOptions.temperatureOption)
    .addOption(cliOptions.topPOption)
    .addOption(cliOptions.topKOption)
    .addOption(cliOptions.systemOption)
    .option('-v, --variable <key=value>', 'Set variable values for the template', collectVariables, {})
    .action(async (name: string, options: any) => {
      try {
        logger.debug(`Attempting to execute template: ${name}`);
        const template = await templateManager.getTemplate(name);
        if (!template) {
          throw new Error(`Template '${name}' not found`);
        }
        logger.debug(`Template found: ${JSON.stringify(template)}`);

        const variables = parseVariables(process.argv, template);
        logger.debug(`Parsed variables: ${JSON.stringify(variables)}`);

        const config = configManager.getConfig();
        const providerName = options.provider || template.provider || config.defaultProvider;
        const modelAlias = options.model || template.model || config.modelAlias;

        logger.debug(`Using provider: ${providerName}, model alias: ${modelAlias}`);

        const modelId = resolveModelAlias(providerName as ProviderName, modelAlias);
        logger.debug(`Resolved model ID: ${modelId}`);

        const provider = await ProviderFactory.getProvider(providerName as ProviderName);

        const defaultOptions: Partial<LLMProviderOptions> = {
          maxTokens: template.parameters?.max_tokens,
          temperature: template.parameters?.temperature,
          topP: template.parameters?.top_p,
          topK: template.parameters?.top_k,
          model: modelId,
        };

        const mergedOptions = mergeOptions(defaultOptions, options);

        const providerOptions: LLMProviderOptions = {
          maxTokens: mergedOptions.maxTokens,
          temperature: mergedOptions.temperature,
          topP: mergedOptions.topP,
          topK: mergedOptions.topK,
          system: mergedOptions.system,
          model: modelId,
        };

        logger.debug(`Provider options: ${JSON.stringify(providerOptions)}`);

        const executionContext: ExecutionContext = {
          template,
          variables,
          providerOptions,
          provider,
        };

        const result = await TemplateExecutor.execute(executionContext);
        console.log('Execution result:');
        console.log(result);
      } catch (error) {
        ErrorManager.handleError('ExecuteTemplateError', `Failed to execute template: ${error}`);
      }
    });
}

function createDeleteCommand(): Command {
  return new Command('delete')
    .description('Delete a template')
    .argument('<name>', 'Name of the template to delete')
    .action(async (name: string) => {
      try {
        await templateManager.deleteTemplate(name);
        logger.info(`Template ${name} deleted successfully`);
      } catch (error) {
        ErrorManager.handleError('DeleteTemplateError', `Failed to delete template: ${error}`);
      }
    });
}

function createViewCommand(): Command {
  return new Command('view')
    .description('View the contents of a template')
    .argument('<name>', 'Name of the template to view')
    .action(async (name: string) => {
      try {
        const template = await templateManager.getTemplate(name);
        console.log(yaml.dump(template));
      } catch (error) {
        ErrorManager.handleError('ViewTemplateError', `Failed to view template: ${error}`);
      }
    });
}

function createEditCommand(): Command {
  return new Command('edit')
    .description('Edit an existing template')
    .argument('<name>', 'Name of the template to edit')
    .action(async (name: string) => {
      try {
        const template = await templateManager.getTemplate(name);
        if (!template) {
          throw new Error(`Template '${name}' not found`);
        }
        const updatedTemplate = await promptForTemplateDetails(template);
        await templateManager.saveTemplate(updatedTemplate);
        logger.info(`Template ${name} updated successfully`);
      } catch (error) {
        ErrorManager.handleError('EditTemplateError', `Failed to edit template: ${error}`);
      }
    });
}

function createVariablesCommand(): Command {
  return new Command('variables')
    .description('Display all variables in a template')
    .argument('<name>', 'Name of the template')
    .action(async (name: string) => {
      try {
        const template = await templateManager.getTemplate(name);
        if (!template) {
          throw new Error(`Template '${name}' not found`);
        }
        displayTemplateVariables(template);
      } catch (error) {
        ErrorManager.handleError('TemplateVariablesError', `Failed to display template variables: ${error}`);
      }
    });
}

function displayTemplateVariables(template: TemplateDefinition): void {
  console.log(`Variables for template '${template.name}':`);
  
  const definedVariables = template.input_variables || {};
  const contentVariables = extractContentVariables(template.content);
  
  if (Object.keys(definedVariables).length === 0 && contentVariables.length === 0) {
    console.log('No variables defined in this template.');
    return;
  }

  // Display defined variables
  for (const [key, variable] of Object.entries(definedVariables)) {
    console.log(`- ${key}:`);
    console.log(`  Type: ${variable.type}`);
    console.log(`  Description: ${variable.description}`);
    if ('default' in variable) {
      console.log(`  Default: ${formatDefaultValue(variable)}`);
    }
    console.log('');
  }

  // Display content variables not defined in input_variables
  for (const key of contentVariables) {
    if (!(key in definedVariables)) {
      console.log(`- ${key}:`);
      console.log(`  Type: undefined`);
      console.log(`  Description: Undefined variable found in content`);
      console.log('');
    }
  }
}

function extractContentVariables(content: string): string[] {
  const variableRegex = /{{(.*?)}}/g;
  const matches = content.match(variableRegex);
  if (!matches) return [];
  return matches.map(match => match.slice(2, -2).trim());
}

function formatDefaultValue(variable: TemplateVariable): string {
  if (variable.type === 'string') {
    return `"${variable.default}"`;
  } else if (variable.type === 'array') {
    return JSON.stringify(variable.default);
  } else {
    return String(variable.default);
  }
}

async function promptForTemplateDetails(existingTemplate?: TemplateDefinition): Promise<TemplateDefinition> {
  const questions: prompts.PromptObject[] = [
    {
      type: 'text',
      name: 'name',
      message: 'Template name:',
      initial: existingTemplate?.name
    },
    {
      type: 'text',
      name: 'version',
      message: 'Version:',
      initial: existingTemplate?.version || '1.0.0'
    },
    {
      type: 'text',
      name: 'description',
      message: 'Description:',
      initial: existingTemplate?.description
    },
    {
      type: 'text',
      name: 'author',
      message: 'Author:',
      initial: existingTemplate?.author
    },
    {
      type: 'text',
      name: 'provider',
      message: 'Provider:',
      initial: existingTemplate?.provider
    },
    {
      type: 'text',
      name: 'model',
      message: 'Model:',
      initial: existingTemplate?.model
    },
    {
      type: 'text',
      name: 'content',
      message: 'Template content:',
      initial: existingTemplate?.content
    }
  ];

  const responses = await prompts(questions);
  return responses as TemplateDefinition;
}

function parseVariables(args: string[], template: TemplateDefinition): Record<string, string> {
  const variables: Record<string, string> = {};
  const variablePattern = /^-v:(\w+)$/;

  for (let i = 0; i < args.length; i++) {
    const match = args[i].match(variablePattern);
    if (match) {
      const variableName = match[1];
      const variableValue = args[i + 1];
      if (variableValue && !variableValue.startsWith('-')) {
        variables[variableName] = variableValue;
        i++; // Skip the next argument as it's the value
      } else {
        logger.warn(`Missing value for variable: ${variableName}`);
      }
    }
  }

  return variables;
}

function collectVariables(value: string, previous: Record<string, string>) {
  const [key, val] = value.split('=');
  return { ...previous, [key]: val };
}

export default createTemplateCommand;