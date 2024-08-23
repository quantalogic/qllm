# QLLM: Quantalogic Large Language Model Library

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

## Supported Providers

QLLM supports the following LLM providers:

- OpenAI
- Anthropic (including AWS Bedrock)
- Groq
- Ollama

## Usage Examples

### Chat Completion

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

### Streaming Chat Completion

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

### Embedding Generation

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

### Function Calling

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

### Using Templates

```typescript
import { TemplateManager, TemplateExecutor, getLLMProvider } from "qllm-lib";

async function templateExample() {
  const templateManager = new TemplateManager({ promptDirectory: "./prompts" });
  await templateManager.init();

  const template = await templateManager.getTemplate("create_story");

  if (template) {
    const provider = await getLLMProvider("ollama");
    const templateExecutor = new TemplateExecutor();

    const { response } = await templateExecutor.execute({
      template,
      variables: {
        subject: "A day in the life of a programmer",
        genre: "Comedy",
        role: "Experienced software developer",
        lang: "English",
        max_length: 200,
      },
      provider,
      providerOptions: { model: "gemma2:2b", maxTokens: 300 },
    });

    console.log(response);
  }
}

templateExample();
```

Example execution:

```
<artifact>
<story>
# A Day in the Life of a Programmer: A Comedy

As the sun rises, our intrepid coder, Dave, stumbles out of bed, his eyes still half-closed. He reaches for his glasses, knocking over a tower of energy drink cans in the process. "Another day in paradise," he mumbles.

Dave boots up his computer, which takes approximately three coffee sips to start. He opens his IDE, ready to conquer the digital world, only to be greeted by 47 unread emails and 23 Slack notifications. "Who needs social life when you have merge conflicts?" he chuckles to himself.

As he dives into coding, Dave engages in his favorite pastime: arguing with himself about variable names. "Is 'data' too vague? Maybe 'information'? Or how about 'stuffThingsAndJunk'?" He settles on 'x' and moves on, promising to rename it later (he won't).

Lunch break arrives, and Dave celebrates by moving from his desk chair to his gaming chair, a journey of approximately two feet. He spends the next hour debugging his lunch order on a food delivery app.

As the day winds down, Dave leans back, admiring his work. "56 bugs fixed, 57 new ones created. Perfectly balanced, as all things should be." He shuts down his computer, ready to dream in binary.

Word count: 200
</story>
</artifact>
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
