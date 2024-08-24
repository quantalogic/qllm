# qllm-lib

## Table of Contents
- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
  - [Basic Usage](#basic-usage)
  - [Intermediate Usage](#intermediate-usage)
  - [Advanced Usage](#advanced-usage)
- [Templates](#templates)
  - [Example Template](#example-template)
  - [Inferred Variables](#inferred-variables)
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

### Basic Usage

#### Initializing a Provider

To start using the API, first import the necessary functions and initialize a provider:

```typescript
import { getProvider, LLMProvider } from 'qllm-lib';

const provider: LLMProvider = getProvider('openai');
```

Make sure to set the `OPENAI_API_KEY` environment variable before initializing the OpenAI provider.

#### Listing Models

To get a list of available models:

```typescript
const models = await provider.listModels();
console.log(models);
```

### Intermediate Usage

#### Generating Chat Completions

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

#### Streaming Chat Completions

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

### Advanced Usage

#### Generating Embeddings

To generate embeddings for text:

```typescript
const embedding = await provider.generateEmbedding({
  content: 'Hello, world!',
  type: 'text',
  model: 'text-embedding-3-small',
});

console.log(embedding);
```

To generate embeddings for images:

```typescript
const imageEmbedding = await provider.generateEmbedding({
  content: '/path/to/image.jpg',
  type: 'image',
});

console.log(imageEmbedding);
```

#### Using Templates

Templates in qllm-lib allow you to define reusable structures for generating complex text outputs. Here's an example of how to use a template:

```typescript
import { Template } from 'qllm-lib';

const template = await Template.fromPath('./prompts/create_story.yaml');

const result = await template.execute({
  subject: 'A day in Paris',
  genre: 'Adventure',
  role: 'Narrator',
  lang: 'English',
  max_length: 200,
});

console.log(result.story);
```

#### Combining Multiple Features

You can combine multiple features, such as generating embeddings and using templates together:

```typescript
const embedding = await provider.generateEmbedding({
  content: 'What is the weather like today?',
  type: 'text',
});

const template = await Template.fromPath('./prompts/weather_report.yaml');

const report = await template.execute({
  location: 'Paris',
  embedding: embedding,
});

console.log(report);
```

## Templates

Templates in qllm-lib allow you to define reusable structures for generating complex text outputs. They support variable inputs, file inclusions, and output variable extraction.

### Example Template

Here's an example of a template file `prompts/create_story.yaml`:

```yaml
name: create_story
version: '1.0'
description: Create a nice story
author: Raphaël MANSUY
input_variables:
  subject:
    type: string
    description: The subject of the story
    default: "Emmanuel Macron dissout l'assemblée"
  genre:
    type: string
    description: The genre of the story
    default: "Humour et satire"
  role:
    type: string
    description: The role of the user
    default: "Gaspar PROUST"
  lang:
    type: string
    description: The language of the story
    default: "Français"
  max_length:
    type: number
    description: The maximum length of the story
    default: 100
output_variables:
  story:
    type: string
    description: The story

content: >
  {{file:./story.md}}
```

This template includes another file `story.md`:

```markdown
## Your role
  {{file:./role.md}}

## Your task

  Write a {{genre}} story about {{subject}}

  Use {{lang}} to write the story.

 ## OUTPUT example

```xml
<artfifact>
    <story>
     ... the story formatted using Markdown. . Length {{max_length}} words ...
    </story>
</artifact> 
```
```

### Inferred Variables

Inferred variables are automatically detected by the template system when they appear in the content but are not explicitly defined in the `input_variables` section. These variables are added to the `input_variables` with a default type of 'string' and marked as `inferred: true`.

For example, if the content includes `{{character_name}}` but it's not defined in `input_variables`, it will be automatically added as an inferred variable. This allows for flexible template creation without the need to explicitly define every variable used in the content.

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
