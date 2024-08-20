# QLLM Library by QuantaLogic

## Overview

The **QLLM Library** is a versatile and user-friendly library designed to facilitate interaction with various language model providers such as OpenAI, Anthropic, Perplexity, and more. It abstracts the complexities of different APIs, allowing developers to focus on building applications that leverage powerful language models.

### Key Features

- **Provider Agnostic**: Seamlessly switch between different LLM providers with minimal changes to your code.
- **Dynamic Configuration**: Load and manage provider configurations easily.
- **Robust Error Handling**: Built-in mechanisms to handle API errors gracefully.
- **Streaming Support**: Stream responses for real-time applications.

## Installation

To install the library, use npm or yarn:

```bash
npm install qllm-lib
```

or

```bash
yarn add qllm-lib
```

## Getting Started

### Basic Setup

To begin using the library, import the necessary modules and configure your desired provider.

```typescript
import { ProviderFactory } from 'qllm-lib';
import { LLMProviderOptions } from 'qllm-types';

async function main() {
  const providerName = 'openai'; // Specify your desired provider
  const options: LLMProviderOptions = {
    model: 'gpt-4o-mini',
    maxTokens: 2048,
    temperature: 0.7,
  };

  const provider = await ProviderFactory.getProvider(providerName);

  // Generate a message using the provider
  const response = await provider.generateMessage(
    [{ role: 'user', content: 'Hello, how are you?' }],
    options,
  );
  console.log(response);
}

main().catch(console.error);
```

### Example Usage of Different Providers

You can easily switch between providers by changing the `providerName` variable.

#### OpenAI Example

```typescript
const providerName = 'openai'; // Using OpenAI provider
```

#### Anthropic Example

```typescript
const providerName = 'anthropic'; // Using Anthropic provider
```

#### Perplexity Example

```typescript
const providerName = 'perplexity'; // Using Perplexity provider
```

### Streaming Responses with Token Processing

For applications requiring real-time feedback, you can stream messages from the provider and process each token as it is generated:

```typescript
async function streamMessages() {
  const providerName = 'openai';
  const options: LLMProviderOptions = {
    model: 'gpt-4o-mini',
    maxTokens: 2048,
    temperature: 0.7,
  };

  const provider = await ProviderFactory.getProvider(providerName);
  const messages = [{ role: 'user', content: 'Tell me a story.' }];

  try {
    let fullResponse = '';

    for await (const token of provider.streamMessage(messages, options)) {
      process.stdout.write(token); // Output each token as it arrives
      fullResponse += token; // Accumulate the full response
    }

    spinner.succeed('Response generated');
    console.log('\nFull Response:', fullResponse);
  } catch (error) {
    console.error('Streaming error:', error);
  }
}

streamMessages().catch(console.error);
```

## Configuration

You can customize provider configurations by modifying the `provider_config.ts` file or loading configurations from a YAML file.

### Example Configuration

```yaml
# .qllmrc.yaml
defaultProvider: openai
providers:
  openai:
    apiKey: YOUR_OPENAI_API_KEY
    model: gpt-4o-mini
  anthropic:
    apiKey: YOUR_ANTHROPIC_API_KEY
    model: claude-3
```

## Error Handling

The library provides robust error handling. You can handle specific errors as follows:

```typescript
try {
  const response = await provider.generateMessage(messages, options);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else {
    console.error('An error occurred:', error.message);
  }
}
```

## Conclusion

The LLM Provider Library is designed to simplify the integration and interaction with various language model APIs. With its flexible architecture and comprehensive error handling, developers can focus on building innovative applications without worrying about the underlying complexities.

For more information, refer to the documentation or explore the source code. Happy coding!
