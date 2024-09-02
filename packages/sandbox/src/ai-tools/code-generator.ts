import { AITool } from '../types';
import { z } from 'zod';
import { createLLMProvider } from 'qllm-lib';
import { TemplateDefinition, TemplateDefinitionBuilder, TemplateExecutor } from 'qllm-lib';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

// Interface declaration
interface codeGeneratorParams {
  language: string;
  task_description: string;
  requirements: string;
}


async function codeGenerator(params: codeGeneratorParams): Promise<any> {
  const templateYaml = fs.readFileSync('src/templates/code_generator.yaml', 'utf8');
  const templateData = yaml.load(templateYaml) as any;

  const codeGenerator = TemplateDefinitionBuilder.create(templateData)
    .withInputVariable('language', 'string', '🗣️ The programming language to generate code in')
    .withInputVariable('task_description', 'string', '📝 Description of the coding task')
    .withInputVariable('requirements', 'string', '📋 Specific requirements for the code')
    .withOutputVariable('code', 'string', { description: '💻 The generated code snippet' })
    .withTags('💡 programming', '🔧 code generation', '🌐 multi-language')
    .withCategories('🖥️ Software Development', '🤖 AI-Assisted Coding')
    .withModel('gpt-4o-mini')
    .withParameters({ max_tokens: 1200, temperature: 0.7, top_p: 0.95 })
    .withPromptType('🧠 code_generation')
    .withTaskDescription(
      '🎯 Generate code snippets in various programming languages based on user requirements',
    )
    .withExampleOutputs(
      `
  <code>
  def fibonacci(n):
      if n <= 1:
          return n
      else:
          return fibonacci(n-1) + fibonacci(n-2)
  </code>
  `,
    )
    .build();

  console.log('🏗️ Generated Template:');
  console.log(codeGenerator);

  const result = await executeTempate(codeGenerator, params);
  console.log('🎉 Template execution result:');
  console.log(result);
  return result;
}

async function executeTempate(templateDefinition: TemplateDefinition, params: codeGeneratorParams) {
  // Execute the template
  const provider = createLLMProvider({ name: 'openai' });
  const templateExecutor = new TemplateExecutor();
  const executionResult = templateExecutor.execute({
    template: templateDefinition,
    provider: provider,
    variables: params,
  });
  return (await executionResult).outputVariables.code;
}

export const CodeGenerator: AITool<codeGeneratorParams, any> = {
  name: 'python-code-generator',
  description: 'python-code using GPT model',
  execute: async (params) => {
    console.log("params : ", params);
    const response = await codeGenerator(params);
    return response;
  }
};