// src/commands/template.ts
import { Command, Option } from 'commander';
import prompts from 'prompts';
import yaml from 'js-yaml';
import { TemplateManager, TemplateManagerConfig } from '@/core/templates/template_manager';
import { configManager } from '@/common/utils/configuration_manager';
import { logger } from '@/common/utils/logger';
import { ErrorManager } from '@/common/utils/error_manager';
import { cliOptions } from '../options';
import { resolveModelAlias } from '@/core/config/model_aliases';
import { displayOptions } from '@/common/utils/option_display';
import { LLMProviderOptions } from '@/core/providers/types';
import { ProviderFactory } from '@/core/providers/provider_factory';
import { ExecutionContext, TemplateDefinition, TemplateVariable } from '@/core/templates/types';
import { TemplateExecutor } from '@/core/templates/template_executor';
import { OutputHandler } from '@/common/utils/output_handler';
import { DEFAULT_APP_CONFIG } from '@/core/config/default_config';
import { ProviderName } from '@/core/config/types';


async function getTemplateManager(promptsDir?: string): Promise<TemplateManager> {

  const templateManagerConfig: TemplateManagerConfig = {
    promptDirectory: promptsDir || configManager.getConfig().promptDirectory,
  };
  const templateManer =  new TemplateManager(
    templateManagerConfig,
  );

  await templateManer.init();
  return templateManer;
}

export function createTemplateCommand(): Command {
  const templateCommand = new Command('template')
    .description('Manage and execute prompt templates')
    .addOption(new Option('--prompts-dir <directory>', 'Set the directory for prompt templates'))
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
        logger.debug('Executing list command');
        const templateManager = await getTemplateManager();
        const templates = await templateManager.listTemplates();
        logger.debug(`Found ${templates.length} templates`);
        console.log('Available templates:');
        if (templates.length === 0) {
          console.log('No templates found.');
        } else {
          templates.forEach(template => console.log(`- ${template}`));
        }
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
        const templateManager = await getTemplateManager();
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
    .addOption(cliOptions.streamOption)
    .addOption(new Option('--output [file]', 'Output file path'))
    .addOption(new Option('--format <format>', 'Output format').choices(['json', 'xml']).default('json'))
    .option('-v, --variable <key=value>', 'Set variable values for the template', collectVariables, {})
    .action(async (name, options, command) => {
      try {
        const config = configManager.getConfig();
        
        const parent = command.parent.opts();
        const parentOptions = command.parent.opts();

        if(parentOptions.profile) {
          process.env.AWS_PROFILE = parentOptions.profile;
        }
        if(parentOptions.region) {
          process.env.AWS_REGION = parentOptions.region;
        }

        logger.debug(`Attempting to execute template: ${name}`);
        const templateManager = await getTemplateManager();
        const template = await templateManager.getTemplate(name);
        if (!template) {
          throw new Error(`Template '${name}' not found`);
        }
        logger.debug(`Template found: ${JSON.stringify(template)}`);
        const variables = await templateManager.parseVariables(process.argv, template);
        logger.debug(`Parsed variables: ${JSON.stringify(variables)}`);

        const modelAlias = parentOptions.model as string || config.defaultModelAlias;
        const providerName = (parentOptions.provider as string || config.defaultProvider || DEFAULT_APP_CONFIG.defaultProvider) as ProviderName;

        // Resolve model alias to model id
        logger.debug(`modelAlias: ${modelAlias}`);
        logger.debug(`providerName: ${providerName}`);
        logger.debug(`defaultProviderName: ${config.defaultProvider}`);
        const modelId = parentOptions.modelId || modelAlias ? resolveModelAlias(providerName, modelAlias) : config.defaultModelId;
        if (!modelId) {
          ErrorManager.throwError('ModelError', `Model id ${modelId} not found`);
        }

        const maxTokens = options.maxTokens || config.defaultMaxTokens;
        logger.debug(`providerName: ${providerName}`);
        logger.debug(`modelId: ${modelId}`);
        logger.debug(`maxTokens: ${maxTokens}`);

        const provider = await ProviderFactory.getProvider(providerName);

        const llmOptions: LLMProviderOptions = {
          maxTokens: maxTokens,
          temperature: options.temperature,
          topP: options.topP,
          topK: options.topK,
          model: modelId,
        };

        displayOptions(llmOptions, 'execute');

        const executionContext: ExecutionContext = {
          template,
          variables,
          providerOptions: llmOptions,
          provider,
          stream: options.stream,
        };

        const result = await TemplateExecutor.execute(executionContext);

        const outputHandler = new OutputHandler(options.output, options.format);
        await outputHandler.handleOutput(result.outputVariables);
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
        const templateManager = await getTemplateManager();
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
        const templateManager = await getTemplateManager();
        const template = await templateManager.getTemplate(name);
        if (template) {
          console.log(yaml.dump(template));
        } else {
          console.log(`Template '${name}' not found.`);
        }
      } catch (error) {
        ErrorManager.handleError('ViewTemplateError', `Failed to view template: ${error}`);
      }
    });
}

function createEditCommand(): Command {
  return new Command('edit')
    .description('Edit an existing template')
    .argument('<name>', 'Name of the template to edit')
    .action(async (name: string,options) => {
      try {
        const templateManager = await getTemplateManager(options.promptsDir);
        const template = await templateManager.getTemplate(name);
        if (!template) {
          throw new Error(`Template '${name}' not found`);
        }
        const updatedTemplate = await promptForTemplateDetails(template);
        await templateManager.updateTemplate(name, updatedTemplate);
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
    .action(async (name: string,options) => {
      try {
        const templateManager = await getTemplateManager(options.promptsDir);
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

async function promptForTemplateDetails(existingTemplate?: TemplateDefinition): Promise<TemplateDefinition> {
  const questions: prompts.PromptObject[] = [
    {
      type: 'text' as const,
      name: 'name',
      message: 'Template name:',
      initial: existingTemplate?.name
    },
    {
      type: 'text' as const,
      name: 'version',
      message: 'Version:',
      initial: existingTemplate?.version || '1.0.0'
    },
    {
      type: 'text' as const,
      name: 'description',
      message: 'Description:',
      initial: existingTemplate?.description
    },
    {
      type: 'text' as const,
      name: 'author',
      message: 'Author:',
      initial: existingTemplate?.author
    },
    {
      type: 'text' as const,
      name: 'provider',
      message: 'Provider:',
      initial: existingTemplate?.provider
    },
    {
      type: 'text' as const,
      name: 'model',
      message: 'Model:',
      initial: existingTemplate?.model
    },
    {
      type: 'text' as const,
      name: 'content',
      message: 'Template content:',
      initial: existingTemplate?.content
    }
  ];

  const responses = await prompts(questions);
  return responses as TemplateDefinition;
}

function collectVariables(value: string, previous: Record<string, string>): Record<string, string> {
  const [key, val] = value.split('=');
  return { ...previous, [key]: val };
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

export default createTemplateCommand;