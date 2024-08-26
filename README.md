# 🚀 QLLM: Simplifying Language Model Interactions

Welcome to QLLM, a project designed to streamline your interactions with Large Language Models (LLMs). This monorepo contains two powerful packages:

1. 📚 qllm-lib: A versatile TypeScript library for seamless LLM integration
2. 🖥️ qllm-cli: A command-line interface for effortless LLM interactions

## 🌟 Why QLLM and QLLM-LIB?

QLLM bridges the gap between cutting-edge language models and their practical implementation in business processes. Our goal is to make the power of generative AI accessible and actionable for businesses of all sizes.

QLLM-LIB provides a user-friendly AI toolbox that empowers developers to harness the potential of various LLMs through a single, unified interface. By simplifying interactions with these AI models, we aim to boost productivity and drive innovation across industries.

## 📦 Packages

### qllm-lib

qllm-lib is a TypeScript library that offers a unified interface for interacting with various LLM providers. It simplifies working with different AI models and provides features like templating, streaming, and conversation management.

#### Practical Example

```typescript
import { createLLMProvider } from 'qllm-lib';

async function generateProductDescription() {
  const provider = createLLMProvider({ name: 'openai' });

  const result = await provider.generateChatCompletion({
    messages: [
      { 
        role: 'user', 
        content: { 
          type: 'text', 
          text: 'Write a compelling product description for a new smartphone with a foldable screen, 5G capability, and 48-hour battery life.' 
        } 
      },
    ],
    options: { model: 'gpt-4', maxTokens: 200 },
  });

  console.log('Generated Product Description:', result.text);
}

generateProductDescription();
```

This example demonstrates how to use qllm-lib to generate a product description, which could be useful for e-commerce platforms or marketing teams.

For more detailed information and advanced usage, check out the [qllm-lib README](./packages/qllm-lib/README.md).

### qllm-cli

qllm-cli is a command-line interface that leverages qllm-lib to provide easy access to LLM capabilities directly from your terminal.

#### Practical Example

```bash
# Generate a product description
qllm ask "Write a 50-word product description for a smart home security camera with night vision and two-way audio."

# Use a specific model for market analysis
qllm ask --model gpt-4o-mini --provider openai "Analyze the potential market impact of electric vehicles in the next 5 years. Provide 3 key points."

# Stream a response for real-time content generation
qllm ask --stream --model gemma2:2b --provider ollama "Write a short blog post about the benefits of remote work."
```

# Describe a picture
qllm ask --stream --model llava:latest --provider ollama "Describe the picture" -i "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Kowloon_Waterfront%2C_Hong_Kong%2C_2013-08-09%2C_DD_05.jpg/640px-Kowloon_Waterfront%2C_Hong_Kong%2C_2013-08-09%2C_DD_05.jpg"
```


These examples show how qllm-cli can be used for various business tasks, from content creation to market analysis.

For a complete list of commands and options, refer to the [qllm-cli README](./packages/qllm-cli/README.md).

## 🚀 Getting Started

### Installing qllm-lib

To use qllm-lib in your project:

```bash
npm install qllm-lib
```

### Installing qllm-cli

To use qllm-cli globally:

```bash
npm install -g qllm
```

## 🛠️ Development

To set up the development environment:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/qllm.git
   cd qllm
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the packages:
   ```bash
   npm run build
   ```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for details.

## 🌟 Final Thoughts

QLLM and QLLM-LIB are designed to make working with Large Language Models more accessible and efficient. Whether you're a developer integrating AI capabilities into your applications or a data scientist streamlining your workflow, QLLM provides the tools you need to leverage the power of AI effectively.

We invite you to explore the detailed documentation for each package and join us in improving how businesses interact with AI. Together, we can create practical solutions that drive real-world impact.

Happy coding! 🚀
