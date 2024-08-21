import { getProvider, LLMProvider } from './providers';

const demo = async () => {
  console.log('Test demo');

  console.log('Creating OpenAIProvider instance');
  const provider = getProvider('openai');
  console.log('Provider created');

  const models = await provider.listModels();
  console.log(models);

  await completion(provider);

  await stream(provider);
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
          data: {
            text: 'What is the capital of France?',
          },
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
          data: {
            text: 'Write a small story about Paris',
          },
        },
      },
    ],
    options: {
      model: 'gpt-4o-mini',
      maxTokens: 1024,
    },
  });

  for await (const message of result) {
    process.stdout.write(message);
  }
}
