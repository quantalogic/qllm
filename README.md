# QLLM: Quantum Large Language Model Library

QLLM is a robust TypeScript library providing a unified interface for interacting with various Large Language Models (LLMs). It simplifies the process of working with multiple LLM providers, offering a consistent API for chat completions, embeddings, and more.

## Features

- 🚀 Multi-provider support (OpenAI, Anthropic, Groq, Ollama)
- 🔄 Easy provider switching
- 📝 Chat completion and streaming
- 🧮 Embedding generation
- 🛠 Function calling and tool use
- 📊 Model listing
- 🗃 Template management for prompts

## Installation

```bash
npm install qllm-lib
```

## Quick Start

```typescript
import { getLLMProvider } from "qllm-lib";

async function main() {
  const provider = await getLLMProvider("openai");

  const response = await provider.generateChatCompletion({
    messages: [
      { role: "user", content: { type: "text", text: "Hello, world!" } },
    ],
    options: { model: "gpt-4o-mini", maxTokens: 100 },
  });

  console.log(response.text);
}

main().catch(console.error);
```

Example execution:

```
Hello! How can I assist you today?
```

## Embedding Generation

```typescript
import { getEmbeddingProvider } from "qllm-lib";

async function embeddingExample() {
  const provider = await getEmbeddingProvider("openai");

  const result = await provider.generateEmbedding({
    model: "text-embedding-3-small",
    content: "Hello, world!",
  });

  console.log(result.embedding.slice(0, 5)); // Show first 5 dimensions
}

embeddingExample();
```

Example execution:

```
[
  -0.03516635298728943,
  -0.022325780987739563,
  -0.020604668930172920,
  0.018447319418191910,
  -0.00019173165992647409
]
```

## Chat Completion

```typescript
import { getLLMProvider, ChatMessage } from "qllm-lib";

async function chatExample() {
  const provider = await getLLMProvider("anthropic");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: { type: "text", text: "You are a helpful assistant." },
    },
    {
      role: "user",
      content: { type: "text", text: "What is the capital of France?" },
    },
  ];

  const response = await provider.generateChatCompletion({
    messages,
    options: { model: "claude-3-opus-20240229", maxTokens: 100 },
  });

  console.log(response.text);
}

chatExample();
```

Example execution:

```
The capital of France is Paris. Paris is not only the political capital but also the cultural and economic center of France. It's known for its iconic landmarks such as the Eiffel Tower, the Louvre Museum, and Notre-Dame Cathedral.
```

## Streaming Chat Completion

```typescript
import { getLLMProvider, ChatMessage } from "qllm-lib";

async function streamingExample() {
  const provider = await getLLMProvider("groq");

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: { type: "text", text: "Write a short story about a robot." },
    },
  ];

  const stream = provider.streamChatCompletion({
    messages,
    options: { model: "mixtral-8x7b-32768", maxTokens: 200 },
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.text || "");
  }
}

streamingExample();
```

Example execution:

```
In a world of steel and circuits, a small robot named Pixel came to life. Its creators had given it one simple task: to water the plants in the laboratory. Day after day, Pixel diligently tended to the greenery, its sensors carefully measuring soil moisture and sunlight levels.

One day, as Pixel was making its rounds, it noticed a wilting flower in the corner. This wasn't part of its usual routine, but something in its programming urged it to investigate. As it approached, its optical sensors detected a small crack in the pot, causing water to leak out.

Pixel paused, its processors whirring as it analyzed the situation. It wasn't programmed for repairs, but it was programmed to care for plants. In a moment of what could only be described as robotic creativity, Pixel used a small amount of sealant from its maintenance kit to patch the crack.

As the days passed, Pixel watched the once-wilting flower flourish. Its databanks registered a new sensation - something akin to pride. From that day forward, Pixel not only watered the plants but also looked for ways to help them thrive, proving that even in a world of metal and code, there was room for growth and adaptation.
```

## Function Calling

```typescript
import {
  getLLMProvider,
  ChatMessage,
  createFunctionToolFromZod,
} from "qllm-lib";
import { z } from "zod";

async function functionCallingExample() {
  const provider = await getLLMProvider("openai");

  const weatherTool = createFunctionToolFromZod({
    name: "get_current_weather",
    description: "Get the current weather in a given location",
    schema: z.object({
      location: z
        .string()
        .describe("The city and state, e.g. San Francisco, CA"),
      unit: z
        .enum(["celsius", "fahrenheit"])
        .describe("The unit of temperature to use"),
    }),
    strict: true,
  });

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: { type: "text", text: "What's the weather like in Paris?" },
    },
  ];

  const response = await provider.generateChatCompletion({
    messages,
    options: { model: "gpt-4o-mini", maxTokens: 150 },
    tools: [weatherTool],
    toolChoice: "auto",
  });

  console.log("Response:", response.text);
  console.log("Tool Calls:", JSON.stringify(response.toolCalls, null, 2));
}

functionCallingExample();
```

Example execution:

```
Response: To get the current weather in Paris, I'll need to use the weather tool. Let me do that for you.

Tool Calls: [
  {
    "id": "call_abc123",
    "type": "function",
    "function": {
      "name": "get_current_weather",
      "arguments": "{\"location\":\"Paris, France\",\"unit\":\"celsius\"}"
    }
  }
]
```

## Image Description Example

### Chat Completion (Non-Streaming)

```typescript
import { getLLMProvider } from "qllm-lib";

async function imageDescriptionExample() {
  const provider = await getLLMProvider("openai");

  const urlDemo =
    "https://images.unsplash.com/photo-1613048981304-12e96c2d3ec4?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  const response = await provider.generateChatCompletion({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Can you describe this image?" },
          { type: "image_url", url: urlDemo },
        ],
      },
    ],
    options: { model: "gpt-4o-mini", maxTokens: 200 },
  });

  console.log("Image description:", response.text);
}

imageDescriptionExample();
```

Example execution:

```
Image description: This image appears to be a scenic view of a city, likely Paris. It shows a cityscape with iconic Parisian architecture, including buildings with ornate facades, domed roofs, and tall spires. In the foreground, there are trees lining the streets, and the image has a warm, golden tone, suggesting it was taken during a sunny day. The overall composition and architectural details suggest this is a picturesque view of the French capital.
```

### Chat Completion (Streaming)

```typescript
import { getLLMProvider } from "qllm-lib";

async function streamingImageDescriptionExample() {
  const provider = await getLLMProvider("openai");

  const urlDemo =
    "https://images.unsplash.com/photo-1613048981304-12e96c2d3ec4?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  const stream = provider.streamChatCompletion({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Can you describe this image?" },
          { type: "image_url", url: urlDemo },
        ],
      },
    ],
    options: { model: "gpt-4o-mini", maxTokens: 200 },
  });

  console.log("Image description:");
  for await (const chunk of stream) {
    process.stdout.write(chunk.text || "");
  }
}

streamingImageDescriptionExample();
```

Example execution:

```
Image description: This image appears to be a scenic view of a city, likely Paris. It shows a cityscape with iconic Parisian architecture, including buildings with ornate facades, domed roofs, and tall spires. In the foreground, there are trees lining the streets, and the image has a warm, golden tone, suggesting it was taken during a sunny day. The overall composition and architectural details suggest this is a picturesque view of the French capital.
```

## Using Templates

Templates are a powerful feature in QLLM that allow you to define a structure for generating complex text outputs. The purpose of templates is to simplify the generation of similar types of content with slight variations, such as stories, reports, or responses.

### Purpose of Templates

The purpose of templates is to provide a reusable structure that can be filled with different data. This is particularly useful in scenarios where you need to generate similar types of content with slight variations.

### Example of a Simple Template

A simple example of a template for generating a greeting message:

```yaml
# greeting.yaml
name: greeting
description: A simple greeting template
input_variables:
  name:
    type: string
    description: The name of the person to greet
content: "Hello, {{name}}!"
```

### Example of Increasing Complexity

1. **Basic Story Template**: A template for generating a simple story.

```yaml
# basic_story.yaml
name: basic_story
description: A basic story template
input_variables:
  location:
    type: string
    description: The location of the story
  character:
    type: string
    description: The main character of the story
content: "Once upon a time in {{location}}, there lived a character named {{character}}."
```

2. **Detailed Report Template**: A template for generating a detailed report.

```yaml
# detailed_report.yaml
name: detailed_report
description: A detailed report template
input_variables:
  title:
    type: string
    description: The title of the report
  date:
    type: string
    description: The date of the report
  summary:
    type: string
    description: A brief summary of the report
content: "Report Title: {{title}}\nDate: {{date}}\nSummary: {{summary}}"
```

3. **Complex Story with Multiple Variables**: A more complex story template.

```yaml
# complex_story.yaml
name: complex_story
description: A complex story template
input_variables:
  year:
    type: number
    description: The year the story takes place
  character:
    type: string
    description: The main character of the story
  goal:
    type: string
    description: The goal of the character
  obstacle:
    type: string
    description: The obstacle the character faces
content: "In the year {{year}}, {{character}} set out to {{goal}}, but faced the challenge of {{obstacle}}."
```

## Advanced Configuration

### AWS Bedrock with Anthropic

To use Anthropic models through AWS Bedrock:

```typescript
import { createAwsBedrockAnthropicProvider } from "qllm-lib";

async function awsBedrockExample() {
  const provider = await createAwsBedrockAnthropicProvider();

  const response = await provider.generateChatCompletion({
    messages: [
      { role: "user", content: { type: "text", text: "Hello, Bedrock!" } },
    ],
    options: {
      model: "anthropic.claude-3-haiku-20240307-v1:0",
      maxTokens: 100,
    },
  });

  console.log(response.text);
}

awsBedrockExample();
```

Example execution:

```
Hello! I'm Claude, an AI assistant. How can I help you today? I'm happy to assist with a wide range of tasks, from answering questions to helping with analysis and creative projects. Please let me know what you'd like to work on.
```

## Error Handling

QLLM provides custom error classes for better error handling:

```typescript
import {
  LLMProviderError,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
} from "qllm-lib";

try {
  // Your QLLM code here
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Authentication failed:", error.message);
  } else if (error instanceof RateLimitError) {
    console.error("Rate limit exceeded:", error.message);
  } else if (error instanceof InvalidRequestError) {
    console.error("Invalid request:", error.message);
  } else if (error instanceof LLMProviderError) {
    console.error("LLM provider error:", error.message);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more details.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
