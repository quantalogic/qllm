# 🚀 qllm-lib

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

const provider: LLMProvider = createLLMProvider({ name: 'openai' });
```

Make sure to set the `OPENAI_API_KEY` environment variable before initializing the OpenAI provider.

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
    model: 'gpt-4o-mini',
    maxTokens: 1024,
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
    model: 'gpt-4o-mini',
    maxTokens: 1024,
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
    model: 'gpt-4o-mini',
    maxTokens: 1024,
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
    model: 'gpt-4o-mini',
    maxTokens: 1024,
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
    model: 'gpt-4o-mini',
    maxTokens: 1024,
  },
});

console.log(result.qllm_response);
```

#### 🗨️ Managing Conversations

qllm-lib provides a ConversationManager to help you manage multi-turn conversations:

```typescript
import { createConversationManager, createLLMProvider } from 'qllm-lib';

const conversationManager = createConversationManager();
const provider = createLLMProvider({ name: 'openai' });

const conversation = await conversationManager.createConversation({
  metadata: { title: 'Trip Planning', description: 'Planning a trip to Paris' },
  initialMessage: "I'm planning a trip to Paris. Can you help me?",
  providerIds: ['openai'],
});

async function chatTurn(userMessage: string) {
  await conversationManager.addMessage(conversation.id, {
    role: 'user',
    content: { type: 'text', text: userMessage },
    providerId: 'openai',
  });

  const history = await conversationManager.getHistory(conversation.id);
  const messages = history.map(msg => ({ role: msg.role, content: msg.content }));

  const result = await provider.generateChatCompletion({
    messages,
    options: { model: 'gpt-4o-mini', maxTokens: 1024 },
  });

  await conversationManager.addMessage(conversation.id, {
    role: 'assistant',
    content: { type: 'text', text: result.text || 'No response' },
    providerId: 'openai',
  });

  console.log('AI:', result.text);
}

await chatTurn('What are the top 3 attractions I should visit?');
await chatTurn('How many days should I plan for my trip?');
await chatTurn('Can you suggest some local restaurants?');

const finalHistory = await conversationManager.getHistory(conversation.id);
console.log('Conversation History:', finalHistory);
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
    default: "Science Fiction"
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

## 2. Executing a Template

To execute a template, you'll use the `TemplateExecutor` class. Here's an example of how to use it:

```typescript
import { Template } from "../templates/template";
import { TemplateExecutor } from "../templates";
import { getLLMProvider } from "../providers";

async function executeTemplate() {
  // Load the template
  const template = await Template.fromPath('./prompts/create_story.yaml');

  // Initialize the LLM provider
  const provider = await getLLMProvider("openai");

  // Create a TemplateExecutor
  const templateExecutor = new TemplateExecutor();

  // Execute the template
  const { response, outputVariables } = await templateExecutor.execute({
    template: template,
    variables: {
      genre: "Mystery",
      protagonist: "Detective Sarah",
      setting: "Victorian London"
    },
    provider: provider,
    providerOptions: {
      model: "gpt-4o-mini",
      maxTokens: 300,
    },
    stream: true,
    onOutput: (output) => {
      if (output.type === OutputEventType.CHUNK) {
        process.stdout.write(output.chunk);
      }
    },
  });

  console.log('Generated story:', response);
  console.log('Output variables:', outputVariables);
}
```

## 3. Advanced Concepts

### Output Variables

Output variables allow you to specify expected outputs from the LLM. They can be used to structure the LLM's response or to extract specific information.

```yaml
output_variables:
  summary:
    type: string
    description: A brief summary of the generated content
  key_points:
    type: array
    description: An array of key points from the generated content
```

### Inferred Variables

Inferred variables are automatically determined by the system based on the content of the template. For example, if your template content includes `{{variable_name}}`, the system will infer that `variable_name` is an input variable, even if it's not explicitly defined in the `input_variables` section.



## 4. Template Include

Template inclusion allows you to modularize your prompts by including content from external files. This is particularly useful for managing complex prompts or reusing common sections across multiple templates.

### Syntax

To include a file in your template, use the following syntax:

```
{{file:./path/to/file.md}}
```

### Example

main_template.yaml:
```yaml
name: comprehensive_analysis
version: '1.0'
description: Perform a comprehensive analysis
author: QLLM Team
input_variables:
  topic:
    type: string
    description: The topic to analyze
content: >
  {{file:./analysis_intro.md}}

  Topic: {{topic}}

  {{file:./analysis_steps.md}}

  {{file:./analysis_conclusion.md}}
```

analysis_intro.md:
```markdown
# Comprehensive Analysis

This analysis will provide a detailed examination of the given topic, covering various aspects and implications.
```

analysis_steps.md:
```markdown
## Analysis Steps

1. Historical context
2. Current state
3. Future implications
4. Potential challenges
5. Opportunities for improvement
```

analysis_conclusion.md:
```markdown
## Conclusion

Summarize the key findings of the analysis and provide recommendations based on the insights gained.
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

This project is licensed under the Apache License, Version 2.0. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.


## 👋 Why We Created QuantaLogic

The potential of generative AI is immense, yet its practical application remains a challenge for many organizations. At QuantaLogic, we believe that the true value of AI lies not in its theoretical capabilities, but in its ability to solve real-world business problems efficiently and effectively.

We created QuantaLogic because we saw a significant gap between the advanced AI models developed by companies like OpenAI, Anthropic, and Mistral, and their practical implementation in everyday business processes. Our mission is to bridge this gap, making the power of generative AI accessible and actionable for businesses of all sizes.

QLLM-LIB is a testament to this mission, providing a versatile and user-friendly AI toolbox that empowers users to harness the full potential of various LLMs and AI Tools through a single, unified interface. By simplifying the interaction with these powerful AI models, we aim to accelerate innovation and drive efficiency across industries.
