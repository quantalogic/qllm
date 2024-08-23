import path from "path";
import { getLLMProvider } from "../providers";
import { LLMProvider, ChatMessage } from "../types";
import { Template } from "../templates/template";
import { TemplateExecutor } from "../templates";
import { OutputEvent, OutputEventType } from "../templates/types";

const runLLMTests = async () => {
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

  await testLLMModel('aws-anthropic', { maxTokens: 1024 }, awsAnthropicModels);
  await testLLMModel('groq', { maxTokens: 1024 }, groqModels);
  await testLLMModel('ollama', { maxTokens: 1024 }, ollamaModels);
  await testLLMModel('openai', { maxTokens: 1024 }, openaiModels);

  console.log('✅ LLM Tests completed');
};

const testLLMModel = async (
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

  await testCompletion(provider, { model: models.textModelName, maxTokens: options.maxTokens });

  console.log(`✅ LLM model test completed for ${providerName}`);
};

async function testCompletion(
  provider: LLMProvider,
  options: { model: string; maxTokens: number },
) {
  // Get path file directory
  const filePath = path.join(__dirname, './prompts/create_story_no_var.yaml');

  const template = await Template.fromPath(filePath);

  const templateExecutor = new TemplateExecutor();
  const { response, outputVariables } = await templateExecutor.execute({
    template: template,
    variables: {},
    provider: provider,
    providerOptions: { model: options.model, maxTokens: options.maxTokens },
    spinner: undefined,
    stream: true,
    onOutput: (output: OutputEvent) => {
      if (output.type === OutputEventType.COMPLETE) {
        console.log('📝 Completion result:', (output as any).response);
      } else if (output.type === OutputEventType.CHUNK) {
        // send directly to the tty
        process.stdout.write((output as any).chunk);
      } else if (output.type === OutputEventType.ERROR) {
        console.error('❌ Error during completion:', (output as any).error);
      }
    }
  });

  console.log('📝 Template execution result:', response);
  console.log('📝 Output variables:', outputVariables);

  console.log('🔤 Starting Prompt Test');
  const messages: ChatMessage[] = [{ role: 'user', content: { type: 'text', text: 'What is the capital of France?' } }];
  const result = await provider.generateChatCompletion({
    messages,
    options: { model: options.model, maxTokens: options.maxTokens },
  });

  console.log('📝 Completion result:', result);
  console.log('✅ Text completion test completed');
}

// Execute the LLM Tests
runLLMTests()
  .then(() => console.log('🎉 All LLM Tests executed successfully'))
  .catch((error) => console.error('❌ Error during LLM tests execution:', error));