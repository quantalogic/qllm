import { AITool } from '../types';
import { z } from 'zod';
import { createLLMProvider } from 'qllm-lib';
import { TemplateDefinition, TemplateDefinitionBuilder, TemplateExecutor } from 'qllm-lib';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

// Interface declaration
interface SummarizerParams {
  file_url: string;
  max_words: number;
}

async function SummerizeTool(params: SummarizerParams): Promise<any> {
  const templateYaml = fs.readFileSync('src/templates/text-summerize.yaml', 'utf8');
  const templateData = yaml.load(templateYaml) as any;

  const documentSummarizer = TemplateDefinitionBuilder.create(templateData)
    .withInputVariable('file_url', 'string', templateData.inputVariables[0].description)
    .withInputVariable('max_words', 'number', templateData.inputVariables[1].description)
    .withOutputVariable('summary', 'string', {
      description: templateData.outputVariables[0].description,
    })
    .withTags(...templateData.tags)
    .withCategories(...templateData.categories)
    .withModel(templateData.model)
    .withParameters(templateData.parameters)
    .withPromptType(templateData.promptType)
    .withTaskDescription(templateData.taskDescription)
    .build();

  const result = await executeTemplate(documentSummarizer, params);
  return result;
}

async function executeTemplate(templateDefinition: TemplateDefinition, params: SummarizerParams) {
  // Execute the template
  const provider = createLLMProvider({ name: 'openai' });
  const templateExecutor = new TemplateExecutor();
  const executionResult = templateExecutor.execute({
    template: templateDefinition,
    provider: provider,
    variables: params,
    stream: true,
  });

  templateExecutor.on("requestSent", (request) => {
    console.log("🚀 Request sent:");
    console.dir(request, { depth: null });
  });

  templateExecutor.on('streamChunk', (chunk: string) => {
    process.stdout.write(chunk);
  });

  return executionResult;
}

export const TextSummerize: AITool<SummarizerParams, any> = {
  name: 'text-summerizer',
  description: 'Summarizes text using GPT model',
  execute: async (params) => {
    console.log("params : ", params);
    const response = await SummerizeTool(params);
    return response;
  }
};