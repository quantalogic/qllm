import { EmbeddingProvider, getLLMProvider, LLMProvider, getEmbeddingProvider } from './providers';

const demo = async () => {
  console.log('Test demo');

  console.log('Creating OpenAIProvider instance');
  const provider = getLLMProvider('openai');
  const embedddingProvider = getEmbeddingProvider('openai');
  console.log('Provider created');

  const models = await provider.listModels();
  console.log(models);

  await completion(provider);

  await stream(provider);

  await embedding(embedddingProvider);
};

demo()
  .then(() => {
    console.log('done');
  })
  .catch((error) => {
    console.error(error);
  });

async function completion(provider: LLMProvider) {
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
      model: 'gpt-4o-mini',
      maxTokens: 1024,
    },
  });

  console.log('result:', result);
}

async function stream(provider: LLMProvider) {
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
      model: 'gpt-4o-mini',
      maxTokens: 1024,
    },
  });

  for await (const message of result) {
    process.stdout.write(message.text || '');
  }
}

async function embedding(provider: EmbeddingProvider) {
  const content = 'Hello, world!';
  const model = 'text-embedding-3-small';
  const result = await provider.generateEmbedding({ model, content });
  console.log(result);
}
