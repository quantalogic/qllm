
# qllm-lib

## Table of Contents
- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
  - [Initializing a Provider](#initializing-a-provider)
  - [Listing Models](#listing-models)
  - [Generating Chat Completions](#generating-chat-completions)
  - [Streaming Chat Completions](#streaming-chat-completions)
  - [Generating Embeddings](#generating-embeddings)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

## Introduction

qllm-lib is a TypeScript library that provides a unified interface for interacting with various Large Language Model (LLM) providers.

## Installation

To install qllm-lib, use npm:

```bash
npm install qllm-lib
```

## Usage

### Initializing a Provider

To start using the API, first import the necessary functions and initialize a provider:

```typescript
import { getProvider, LLMProvider } from 'qllm-lib';

const provider: LLMProvider = getProvider('openai');
```

Make sure to set the `OPENAI_API_KEY` environment variable before initializing the OpenAI provider.

### Listing Models

To get a list of available models:

```typescript
const models = await provider.listModels();
console.log(models);
```

### Generating Chat Completions

To generate a chat completion:

```typescript
const result = await provider.generateChatCompletion({
  messages: [
    {
      role: 'user',
      content: {
        type: 'text',
        data: { text: 'What is the capital of France?' },
      },
    },
  ],
  options: {
    model: 'gpt-4',
    maxTokens: 1024,
  },
});

console.log(result.text);
```

### Streaming Chat Completions

To stream a chat completion:

```typescript
const stream = await provider.streamChatCompletion({
  messages: [
    {
      role: 'user',
      content: {
        type: 'text',
        data: { text: 'Write a short story about Paris.' },
      },
    },
  ],
  options: {
    model: 'gpt-4',
    maxTokens: 1024,
  },
});

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### Generating Embeddings

To generate embeddings for text or images:

```typescript
const embedding = await provider.generateEmbedding({
  content: 'Hello, world!',
  type: 'text',
  model: 'text-embedding-3-small',
});

console.log(embedding);
```

For images:

```typescript
const imageEmbedding = await provider.generateEmbedding({
  content: '/path/to/image.jpg',
  type: 'image',
});

console.log(imageEmbedding);
```

## API Reference

### LLMProvider Interface

- `version`: string
- `name`: string
- `defaultOptions`: LLMOptions
- `generateEmbedding(input: InputType): Promise<number[]>`
- `listModels(): Promise<Model[]>`
- `generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>`
- `streamChatCompletion(params: ChatCompletionParams): AsyncIterableIterator<string>`

### Types

- `ChatMessage`: Represents a chat message with role and content.
- `LLMOptions`: Options for LLM generation, including model, max tokens, temperature, etc.
- `InputType`: Input for embedding generation, supporting text and images.
- `Model`: Represents an LLM model with id, description, and creation date.
- `ChatCompletionParams`: Parameters for chat completion, including messages and options.
- `ChatCompletionResponse`: Response from chat completion, including generated text and usage statistics.

## Error Handling

The API uses custom error classes for different types of errors:

- `LLMProviderError`: Base class for all provider errors.
- `AuthenticationError`: Thrown when authentication fails.
- `RateLimitError`: Thrown when rate limits are exceeded.
- `InvalidRequestError`: Thrown for invalid requests or unexpected errors.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache License, Version 2.0. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
