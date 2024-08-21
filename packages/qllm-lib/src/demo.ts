import { OpenAIProvider } from './providers/openai';

const demo = async () => {
  console.log('Test demo');

  console.log('Creating OpenAIProvider instance');
  const provider = new OpenAIProvider();
  console.log('Provider created');

  const models = await provider.listModels();
  console.log(models);

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
};

demo()
  .then(() => {
    console.log('done');
  })
  .catch((error) => {
    console.error(error);
  });
