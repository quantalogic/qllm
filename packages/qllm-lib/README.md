# 🚀 qllm-lib

![npm version](https://img.shields.io/npm/v/qllm-lib)
![Stars](https://img.shields.io/github/stars/quantalogic/qllm)
![Forks](https://img.shields.io/github/forks/quantalogic/qllm)

## 📚 Table of Contents

- [Introduction](#-introduction)
- [Installation](#-installation)
- [Usage](#-usage)
  - [Basic Usage](#basic-usage)
  - [Intermediate Usage](#intermediate-usage)
  - [Advanced Usage](#advanced-usage)
- [Templates](#-templates)
  - [Example Template](#example-template)
  - [Inferred Variables](#inferred-variables)
- [API Reference](#-api-reference)
- [Error Handling](#-error-handling)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Introduction

qllm-lib is a powerful TypeScript library that provides a unified interface for interacting with various Large Language Model (LLM) providers. It simplifies the process of working with different AI models and offers advanced features like templating, streaming, and conversation management.

## 💻 Installation

To install qllm-lib, use npm:

```bash
npm install qllm-lib
```

## 🔧 Usage

### Basic Usage

#### 🚀 Initializing a Provider

To start using the API, first import the necessary functions and initialize a provider:

```typescript
import { createLLMProvider, LLMProvider } from 'qllm-lib';

// Make sure to set the appropriate environment variables for your chosen provider
// e.g., OPENAI_API_KEY for OpenAI
const provider: LLMProvider = createLLMProvider({ name: 'openai' });
```

#### 📋 Listing Models

To get a list of available models:

```typescript
const models = await provider.listModels();
console.log(models);
```

### Intermediate Usage

#### 💬 Generating Chat Completions

To generate a chat completion:

```typescript
const result = await provider.generateChatCompletion({
  messages: [
    {
      role: 'user',
      content: { type: 'text', text: 'What is the capital of France?' },
    },
  ],
  options: {
    model: 'gpt-4',
    maxTokens: 1024,
    temperature: 0.7,
  },
});

console.log(result.text);
```

#### 🌊 Streaming Chat Completions

To stream a chat completion:

```typescript
const stream = await provider.streamChatCompletion({
  messages: [
    {
      role: 'user',
      content: { type: 'text', text: 'Write a short story about Paris.' },
    },
  ],
  options: {
    model: 'gpt-4',
    maxTokens: 1024,
    temperature: 0.7,
    topProbability: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  },
});

for await (const chunk of stream) {
  if (chunk.text) {
    process.stdout.write(chunk.text);
  }
}
```

### Advanced Usage

#### 🧠 Generating Embeddings

To generate embeddings for text:

```typescript
const embedding = await provider.generateEmbedding({
  content: 'Hello, world!',
  model: 'text-embedding-3-small',
});

console.log(embedding);
```

#### 🖼️ Using Images in Chat Completions

You can include images in your chat completions:

```typescript
const result = await provider.generateChatCompletion({
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What do you see in this image?' },
        { type: 'image_url', url: 'https://example.com/eiffel-tower.jpg' },
      ],
    },
  ],
  options: {
    model: 'gpt-4-vision-preview',
    maxTokens: 1024,
    temperature: 0.7,
  },
});

console.log(result.text);
```

#### 🛠️ Using Function Calling

You can use function calling to enable the AI to interact with external tools or APIs:

```typescript
import { z } from 'zod';
import { createFunctionToolFromZod } from 'qllm-lib';

const weatherSchema = z.object({
  location: z.string().describe('The city and state, e.g. San Francisco, CA'),
  unit: z.enum(['celsius', 'fahrenheit']).describe('The temperature unit'),
});

const weatherTool = createFunctionToolFromZod({
  name: 'get_current_weather',
  description: 'Get the current weather in a given location',
  schema: weatherSchema,
});

const result = await provider.generateChatCompletion({
  messages: [
    { role: 'user', content: { type: 'text', text: 'What's the weather like in Paris?' } },
  ],
  tools: [weatherTool],
  toolChoice: 'auto',
  options: {
    model: 'gpt-4',
    maxTokens: 1024,
    temperature: 0.7,
  },
});

console.log(result.text);
console.log(result.toolCalls);
```

#### 📝 Using Templates

Templates in qllm-lib allow you to define reusable structures for generating complex text outputs. Here's an example of how to use a template:

```typescript
import { TemplateManager } from 'qllm-lib';

const templateManager = new TemplateManager();
const template = await templateManager.getTemplate('create_story');

const result = await templateManager.executeTemplate({
  template,
  variables: {
    subject: 'A day in Paris',
    genre: 'Adventure',
    role: 'Narrator',
    lang: 'English',
    max_length: 200,
  },
  provider,
  providerOptions: {
    model: 'gpt-4',
    maxTokens: 1024,
    temperature: 0.7,
  },
});

console.log(result.response);
```

### Example Template

Here's an example of a template structure:

```yaml
name: create_story
description: Generate a story based on given parameters
provider: openai
model: gpt-4
parameters:
  temperature: 0.7
  top_p: 1.0
  frequency_penalty: 0.0
  presence_penalty: 0.0
  max_tokens: 1024
  stop_sequences: []
  system_message: You are a creative storyteller.

input_variables:
  - name: subject
    description: The main subject or theme of the story
    type: string
    required: true
  - name: genre
    description: The genre of the story
    type: string
    required: true
  - name: role
    description: The narrative perspective
    type: string
    required: true
  - name: lang
    description: The language to generate the story in
    type: string
    required: true
  - name: max_length
    description: Maximum length of the story in words
    type: number
    required: true

content: |
  Write a {{genre}} story about {{subject}} from the perspective of a {{role}}.
  The story should be in {{lang}} and should not exceed {{max_length}} words.
  Make it engaging and descriptive.
```

#### 🗨️ Managing Conversations

qllm-lib provides a ConversationManager to help you manage multi-turn conversations:

```typescript
import { createConversationManager, createLLMProvider } from 'qllm-lib';

const provider = createLLMProvider({ name: 'openai' });
const conversationManager = createConversationManager();

// Create a new conversation
const conversation = await conversationManager.createConversation();

// Add a user message
await conversationManager.addMessage(conversation.id, {
  role: 'user',
  content: { type: 'text', text: 'Tell me about Paris.' },
});

// Get conversation history
const history = await conversationManager.getHistory(conversation.id);
const messages = history.map((msg) => ({ role: msg.role, content: msg.content }));

const result = await provider.generateChatCompletion({
  messages,
  options: { model: 'gpt-4', maxTokens: 1024, temperature: 0.7 },
});

await conversationManager.addMessage(conversation.id, {
  role: 'assistant',
  content: { type: 'text', text: result.text || 'No response' },
  providerId: provider.name,
});
```

## 📄 Templates

# QLLM Templates

## 1. What is a Template?

A template in QLLM is a reusable prompt structure with variables that can be filled dynamically. It allows for creating flexible and customizable prompts for Large Language Models (LLMs).

### Template Structure

A typical template consists of:

1. Metadata (name, version, description, author)
2. Input variables
3. Content (the actual prompt text with placeholders)
4. Output variables (optional)

### Examples

#### Example 1: Simple Template (YAML)

```yaml
name: greeting
version: '1.0'
description: A simple greeting template
author: QLLM Team
input_variables:
  name:
    type: string
    description: The name of the person to greet
content: >
  Hello {{name}}! How are you today?
```

#### Example 2: Story Creation Template (YAML)

```yaml
name: create_story
version: '1.0'
description: Create a short story
author: QLLM Team
input_variables:
  genre:
    type: string
    description: The genre of the story
    default: 'Science Fiction'
  protagonist:
    type: string
    description: The main character of the story
  setting:
    type: string
    description: The setting of the story
content: >
  Write a {{genre}} story featuring a protagonist named {{protagonist}} set in {{setting}}. 
  The story should be approximately 200 words long.
output_variables:
  story:
    type: string
    description: The generated story
```

#### Example 3: Template with File Inclusion (YAML)

```yaml
name: improve_prompt
version: '1.0'
description: Improve a given prompt
author: QLLM Team
input_variables:
  prompt:
    type: string
    description: The prompt to improve
content: >
  {{file:./improve_prompt.md}}
```

Where `improve_prompt.md` contains:

```markdown
You are an expert prompt engineer. Your task is to improve the following prompt:

{{prompt}}

Please provide an improved version of this prompt, making it clearer, more specific, and more effective.
```

By using template includes, you can create more maintainable and modular prompt structures, making it easier to update and reuse common elements across different templates.

## 📚 API Reference

### LLMProvider Interface

- `version`: string
- `name`: string
- `defaultOptions`: LLMOptions
- `generateEmbedding(input: EmbeddingRequestParams): Promise<EmbeddingResponse>`
- `listModels(): Promise<Model[]>`
- `generateChatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse>`
- `streamChatCompletion(params: ChatCompletionParams): AsyncIterableIterator<ChatStreamCompletionResponse>`

### Types

- `ChatMessage`: Represents a chat message with role and content.
- `LLMOptions`: Options for LLM generation, including model, max tokens, temperature, etc.
- `EmbeddingRequestParams`: Input for embedding generation, supporting text and models.
- `Model`: Represents an LLM model with id, description, and creation date.
- `ChatCompletionParams`: Parameters for chat completion, including messages and options.
- `ChatCompletionResponse`: Response from chat completion, including generated text and usage statistics.

## 🚨 Error Handling

The API uses custom error classes for different types of errors:

- `LLMProviderError`: Base class for all provider errors.
- `AuthenticationError`: Thrown when authentication fails.
- `RateLimitError`: Thrown when rate limits are exceeded.
- `InvalidRequestError`: Thrown for invalid requests or unexpected errors.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
