import { z } from 'zod';
import { getEmbeddingProvider, getLLMProvider } from '../providers';
import { EmbeddingProvider, LLMProvider } from '../types';
import { createImageContent, createFunctionToolFromZod } from '../utils';

// LLM Tests

const runLLMTests = async () => {
  await testLLMModel('ollama', {
    model: 'llava-phi3:latest', // Ollama specific model
    maxTokens: 1024,      // Ollama specific max tokens
  });
  
  await testLLMModel('openai', {
    model: 'gpt-4o-mini',      // OpenAI specific model
    maxTokens: 1024,     // OpenAI specific max tokens
  });
};

const testLLMModel = async (providerName: string, options: { model: string; maxTokens: number }) => {
  console.log(`Test LLM model with provider: ${providerName}`);

  // Initialize LLM provider
  const provider = getLLMProvider(providerName);
  console.log(`${providerName}Provider instance created`);

  // Execute various completions with options
  await completion(provider, options);
  await stream(provider, options);
  await completionImage(provider, options);
  await completionWithTool(provider, options);
};

// Embedding Test

const runEmbeddingTest = async () => {
/*  await testEmbeddingModel('ollama', {
    model: 'gemma2:2b', // Ollama specific model
    maxTokens: 1024,      // Ollama specific max tokens
  });*/
  
  await testEmbeddingModel('openai', {
    model: 'gpt-4o-mini',      // OpenAI specific model
    maxTokens: 1024,     // OpenAI specific max tokens
  });
};

const testEmbeddingModel = async (providerName: string, options: { model: string; maxTokens: number }) => {
  console.log(`Test Embedding model with provider: ${providerName}`);

  // Initialize Embedding provider
  const embeddingProvider = getEmbeddingProvider(providerName);
  console.log(`${providerName}Provider instance created`);

  // Execute embedding test
  await embedding(embeddingProvider, options);
};

// LLM Completion Functions

async function completion(provider: LLMProvider, options: { model: string; maxTokens: number }) {
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

  console.log('Completion result:', result);
}

async function stream(provider: LLMProvider, options: { model: string; maxTokens: number }) {
  const result = await provider.streamChatCompletion({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: 'Write a small story about Paris',
        },
      },
    ],
    options: {
      model: options.model,
      maxTokens: options.maxTokens,
    },
  });

  for await (const message of result) {
    process.stdout.write(message.text || '');
  }
}

async function completionImage(provider: LLMProvider, options: { model: string; maxTokens: number }) {

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

  console.log('Image completion result:', result);
}

async function completionWithTool(provider: LLMProvider, options: { model: string; maxTokens: number }) {
  // Define the weather parameters schema
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

  console.log('🔥 Weather Tool');

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

  console.log('Tool completion result:');
  console.dir(result, { depth: null });
}

// Embedding Function

async function embedding(provider: EmbeddingProvider, options: { model: string; maxTokens: number }) {
  const content = 'Hello, world!';
  const model = options.model; // Use the model from options
  const result = await provider.generateEmbedding({ model, content });
  console.log('Embedding result:', result);
}

// Execute the LLM Tests
runLLMTests()
  .then(() => {
    console.log('LLM Tests executed successfully');
  })
  .catch((error) => {
    console.error('Error during LLM tests execution:', error);
  });

// Execute the Embedding Tests
/*runEmbeddingTest()
  .then(() => {
    console.log('Embedding Tests executed successfully');
  })
  .catch((error) => {
    console.error('Error during Embedding Tests execution:', error);
  });*/