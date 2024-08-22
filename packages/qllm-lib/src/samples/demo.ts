import { z } from 'zod';
import { getEmbeddingProvider, getLLMProvider } from '../providers';
import { EmbeddingProvider, LLMProvider } from '../types';
import { createImageContent, createFunctionToolFromZod } from '../utils';

// LLM Tests

const runLLMTests = async () => {
  console.log('🚀 Starting LLM Tests');

  await testListModels("ollama");

  await testLLMModel('ollama', {
    model: 'mistral',
    maxTokens: 1024,
  });
  
  await testLLMModel('openai', {
    model: 'gpt-4o-mini',
    maxTokens: 1024,
  });

  console.log('✅ LLM Tests completed');
};

const testListModels = async (providerName: string) => {
  console.log(`📋 Listing models for provider: ${providerName}`);
  const provider = getLLMProvider(providerName);
  const models = await provider.listModels();
  console.log('📊 Available models:');
  console.dir(models, { depth: null });
  console.log('✅ Model listing completed');
}

const testLLMModel = async (providerName: string, options: { model: string; maxTokens: number }) => {
  console.log(`🧪 Testing LLM model with provider: ${providerName}`);

  // Initialize LLM provider
  const provider = getLLMProvider(providerName);
  console.log(`🔧 ${providerName}Provider instance created`);

  // Execute various completions with options
  await completion(provider, options);
  await stream(provider, options);
  await completionImage(provider, options);
  await completionWithTool(provider, options);

  console.log(`✅ LLM model test completed for ${providerName}`);
};

// Embedding Test

const runEmbeddingTest = async () => {
  console.log('🚀 Starting Embedding Tests');

  await testEmbeddingModel('openai', {
    model: 'gpt-4o-mini',
    maxTokens: 1024,
  });

  console.log('✅ Embedding Tests completed');
};

const testEmbeddingModel = async (providerName: string, options: { model: string; maxTokens: number }) => {
  console.log(`🧪 Testing Embedding model with provider: ${providerName}`);

  // Initialize Embedding provider
  const embeddingProvider = getEmbeddingProvider(providerName);
  console.log(`🔧 ${providerName}Provider instance created for embedding`);

  // Execute embedding test
  await embedding(embeddingProvider, options);

  console.log(`✅ Embedding model test completed for ${providerName}`);
};

// LLM Completion Functions

async function completion(provider: LLMProvider, options: { model: string; maxTokens: number }) {
  console.log('🔤 Starting text completion test');
  const result = await provider.generateChatCompletion({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: 'What is the capital of France?',
        },
      },
    ],
    options: {
      model: options.model,
      maxTokens: options.maxTokens,
    },
  });

  console.log('📝 Completion result:', result);
  console.log('✅ Text completion test completed');
}

async function stream(provider: LLMProvider, options: { model: string; maxTokens: number }) {
  console.log('🌊 Starting streaming completion test');
  const result = await provider.streamChatCompletion({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: 'Write a small story about Paris. Less than 30 words.',
        },
      },
    ],
    options: {
      model: options.model,
      maxTokens: options.maxTokens,
    },
  });

  console.log('📜 Streaming result:');
  for await (const message of result) {
    process.stdout.write(message.text || '');
  }
  console.log('\n✅ Streaming completion test completed');
}

async function completionImage(provider: LLMProvider, options: { model: string; maxTokens: number }) {
  console.log('🖼️ Starting image completion test');

  const urlDemo = "https://images.unsplash.com/photo-1613048981304-12e96c2d3ec4?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  const result = await provider.generateChatCompletion({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Can you describe this image?',
          },
          {
            type: 'image_url',
            imageUrl: {
              url: urlDemo,
            },
          },
        ],
      },
    ],
    options: {
      model: options.model,
      maxTokens: options.maxTokens,
    },
  });

  console.log('🎨 Image completion result:', result);
  console.log('✅ Image completion test completed');
}

async function completionWithTool(provider: LLMProvider, options: { model: string; maxTokens: number }) {
  console.log('🛠️ Starting completion with tool test');

  const weatherToolParameters = z.object({
    location: z.string().describe('The city and state, e.g. San Francisco, CA'),
    unit: z.enum(['celsius', 'fahrenheit']).describe('The unit of temperature to use'),
  });

  const weatherTool = createFunctionToolFromZod({
    name: 'get_current_weather',
    description: 'Get the current weather in a given location',
    schema: weatherToolParameters,
    strict: true,
  });

  console.log('🌡️ Weather Tool created');

  const result = await provider.generateChatCompletion({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: 'What is the Weather in Paris?',
        },
      },
    ],
    parallelToolCalls: true,
    toolChoice: 'required',
    tools: [weatherTool],
    options: {
      model: options.model,
      maxTokens: options.maxTokens,
    },
  });

  console.log('🔧 Tool completion result:');
  console.dir(result, { depth: null });
  console.log('✅ Completion with tool test completed');
}

// Embedding Function

async function embedding(provider: EmbeddingProvider, options: { model: string; maxTokens: number }) {
  console.log('🧬 Starting embedding generation');
  const content = 'Hello, world!';
  const model = options.model;
  const result = await provider.generateEmbedding({ model, content });
  console.log('🔢 Embedding result:', result);
  console.log('✅ Embedding generation completed');
}

// Execute the LLM Tests
runLLMTests()
  .then(() => {
    console.log('🎉 All LLM Tests executed successfully');
  })
  .catch((error) => {
    console.error('❌ Error during LLM tests execution:', error);
  });

// Execute the Embedding Tests
/*runEmbeddingTest()
  .then(() => {
    console.log('🎉 All Embedding Tests executed successfully');
  })
  .catch((error) => {
    console.error('❌ Error during Embedding Tests execution:', error);
  });*/