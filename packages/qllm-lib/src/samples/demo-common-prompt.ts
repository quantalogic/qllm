import path from 'path';
import { getLLMProvider } from '../providers';
import { LLMProvider } from '../types';
import { Template } from '../templates/template';
import { TemplateExecutor } from '../templates';
import readline from 'readline';

export const runLLMTests = async (filePath: string) => {
  console.log('🚀 Starting LLM Prompts Tests');

  const awsAnthropicModels = {
    embeddingModelName: '',
    visionModelName: 'anthropic.claude-3-haiku-20240307-v1:0',
    toolModelName: 'anthropic.claude-3-haiku-20240307-v1:0',
    textModelName: 'anthropic.claude-3-haiku-20240307-v1:0',
  };

  const groqModels = {
    embeddingModelName: 'nomic-embed-text',
    visionModelName: 'llama-3.1-70b-versatile',
    toolModelName: 'llama3-groq-70b-8192-tool-use-preview',
    textModelName: 'llama-3.1-70b-versatile',
  };

  const ollamaModels = {
    embeddingModelName: 'nomic-embed-text:latest',
    visionModelName: 'llava:latest',
    toolModelName: 'mistral:latest',
    textModelName: 'gemma2:2b',
  };

  const openaiModels = {
    embeddingModelName: 'text-embedding-3-small',
    visionModelName: 'gpt-4o-mini',
    toolModelName: 'gpt-4o-mini',
    textModelName: 'gpt-4o-mini',
  };

  await testLLMModel(filePath, 'aws-anthropic', { maxTokens: 1024 }, awsAnthropicModels);
  await testLLMModel(filePath, 'groq', { maxTokens: 1024 }, groqModels);
  await testLLMModel(filePath, 'ollama', { maxTokens: 1024 }, ollamaModels);
  await testLLMModel(filePath, 'openai', { maxTokens: 1024 }, openaiModels);

  console.log('✅ LLM Tests completed');
};

const testLLMModel = async (
  filePath: string,
  providerName: string,
  options: { maxTokens: number },
  models: {
    embeddingModelName: string;
    visionModelName: string;
    toolModelName: string;
    textModelName: string;
  },
) => {
  console.log(`🧪 Testing LLM model with provider: ${providerName}`);

  const provider = await getLLMProvider(providerName);
  console.log(`🔧 ${providerName}Provider instance created`);

  await testCompletion(filePath, provider, {
    model: models.textModelName,
    maxTokens: options.maxTokens,
  });

  console.log(`✅ LLM model test completed for ${providerName}`);
};

async function testCompletion(
  filePath: string,
  provider: LLMProvider,
  options: { model: string; maxTokens: number },
) {
  const template = await Template.fromPath(filePath);

  const templateExecutor = new TemplateExecutor();

  templateExecutor.on('streamChunk', (chunk: string) => {
    process.stdout.write(chunk);
  });

  templateExecutor.on('streamComplete', (response: string) => {
    console.log('📝 Completion result:', response);
  });

  templateExecutor.on('streamError', (error: any) => {
    console.error('❌ Error during completion:', error);
  });

  templateExecutor.on('requestSent', (request: any) => {});


  const { response, outputVariables } = await templateExecutor.execute({
    template: template,
    variables: {},
    provider: provider,
    providerOptions: { model: options.model, maxTokens: options.maxTokens },
    stream: true,
    onPromptForMissingVariables: async (template, initialVariables) => {
      console.log('🔤 onPromptFromMissingVariables');
      console.dir(template.input_variables, { depth: null });

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const promptForVariable = (variableName: string, variableDetails: any) => {
        return new Promise<string>((resolve) => {
          rl.question(
            `Please enter a value for ${variableName} (${variableDetails.description}): `,
            (answer) => {
              resolve(answer);
            },
          );
        });
      };

      const resolvedVariables = { ...initialVariables };
      for (const [key, value] of Object.entries(template.input_variables || {})) {
        if (!(key in resolvedVariables)) {
          resolvedVariables[key] = await promptForVariable(key, value);
        }
      }

      rl.close();
      return resolvedVariables;
    },
  });

  console.log('📝 Template execution result:', response);
  console.log('📝 Output variables:', outputVariables);

  console.log('✅ Text completion test completed');
}
