// src/index.ts
import { getCredentials } from './credentials';
import { createAnthropicClient } from './anthropic-client';
import { MODEL_ID } from './config';

async function main() {
  try {
    const credentials = await getCredentials();
    const client = createAnthropicClient(credentials);

    // Create a message using Claude 3 Sonnet on Bedrock
    const message = await client.messages.create({
      model: MODEL_ID,
      max_tokens: 256,
      messages: [
        { role: 'user', content: 'Hello, Claude! What are the benefits of using AWS Bedrock?' }
      ]
    });

    console.log('Claude\'s response:');
    console.log(message.content);

    // Example of streaming the response
    console.log('\nStreaming response:');
    const stream = client.messages.stream({
      model: MODEL_ID,
      max_tokens: 256,
      messages: [
        { role: 'user', content: 'Explain the concept of serverless computing in simple terms.' }
      ]
    });

    stream.on('text', (text) => {
      process.stdout.write(text);
    });

    const finalMessage = await stream.finalMessage();
    console.log('\n\nFinal streamed message:');
    console.log(finalMessage.content);

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();