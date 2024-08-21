import { getEmbeddingProvider, getLLMProvider } from './providers';
import { EmbeddingProvider, LLMProvider } from './types';

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

  await completionImage(provider);
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

async function completionImage(provider: LLMProvider) {
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
              url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Caucasus%2C_Ingushetia%2C_%D0%98%D0%BD%D0%B3%D1%83%D1%88%D1%81%D0%BA%D0%B8%D0%B5_%D0%B1%D0%BE%D0%B5%D0%B2%D1%8B%D0%B5_%D0%B8_%D1%81%D0%BC%D0%BE%D1%82%D1%80%D0%BE%D0%B2%D1%8B%D0%B5_%D0%B1%D0%B0%D1%88%D0%BD%D0%B8%2C_%D0%B3%D0%BE%D1%80%D1%8B_%D0%9A%D0%B0%D0%B2%D0%BA%D0%B0%D0%B7%D0%B0.jpg/2560px-Caucasus%2C_Ingushetia%2C_%D0%98%D0%BD%D0%B3%D1%83%D1%88%D1%81%D0%BA%D0%B8%D0%B5_%D0%B1%D0%BE%D0%B5%D0%B2%D1%8B%D0%B5_%D0%B8_%D1%81%D0%BC%D0%BE%D1%82%D1%80%D0%BE%D0%B2%D1%8B%D0%B5_%D0%B1%D0%B0%D1%88%D0%BD%D0%B8%2C_%D0%B3%D0%BE%D1%80%D1%8B_%D0%9A%D0%B0%D0%B2%D0%BA%D0%B0%D0%B7%D0%B0.jpg',
            },
          },
        ],
      },
    ],
    options: {
      model: 'gpt-4o-mini',
      maxTokens: 1024,
    },
  });

  console.log('result:', result);
}

async function embedding(provider: EmbeddingProvider) {
  const content = 'Hello, world!';
  const model = 'text-embedding-3-small';
  const result = await provider.generateEmbedding({ model, content });
  console.log(result);
}
