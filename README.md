# QLLM: Multi-Provider LLM Command CLI 🚀

QLLM (QuantaLogic LLM) is a powerful and flexible Command Line Interface (CLI) for interacting with multiple Large Language Model (LLM) providers. Built with ❤️ by [@quantalogic](https://github.com/quantalogic), QLLM simplifies the process of leveraging state-of-the-art language models in your projects and workflows.

⭐ If you find QLLM useful, consider giving us a star on GitHub! It helps us reach more developers and improve the tool. ⭐

## 🌟 Key Features

- 🔄 Multi-provider support (currently featuring AWS Bedrock Anthropic's Claude models, OpenAI an [Ollama](https://ollama.com/))
- 💬 Interactive chat mode for continuous conversations
- 🌊 Streaming responses for real-time output
- ⚙️ Configurable model parameters (temperature, top-p, top-k, etc.)
- 📁 File input/output support for batch processing
- 🎨 Customizable output formats (JSON, Markdown, plain text)
- 🛠️ Easy-to-use configuration management

## 📚 Table of Contents

- [Quick Start](#-quick-start)
- [Detailed Documentation](#-detailed-documentation)
- [Examples and Use Cases](#-examples-and-use-cases)
- [Project Structure](#-project-structure)
- [Dependencies](#-dependencies)
- [Contributing](#-contributing)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Frequently Asked Questions](#-frequently-asked-questions)
- [Roadmap](#-roadmap)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)
- [Contact](#-contact)

## 🏁 Quick Start

### What is QLLM?

QLLM is a command-line tool that allows you to interact with various Large Language Models (LLMs) through a unified interface. It supports multiple providers, enabling you to leverage different AI models for tasks such as text generation, analysis, and interactive conversations.

### Prerequisites

- Node.js (v16 or later)
- npm (v6 or later)
- AWS account with AWS Bedrock access (for Anthropic models)

### Installation

Install QLLM globally using npm:

```bash
npm install -g qllm
```

This makes the `qllm` command available system-wide.

### Basic Usage

1. Ask a question:
   ```bash
   qllm ask "Write a 100-word story about a time traveler" --max-tokens 150
   ```

2. Start an interactive chat session:
   ```bash
   qllm chat --max-tokens 150 --provider anthropic --model haiku
   ```

3. Stream a response:
   ```bash
   qllm stream "Explain quantum computing" --max-tokens 200
   ```

4. View configuration:
   ```bash
   qllm config --show
   ```

## 📚 Detailed Documentation

### Command Structure

QLLM offers four main commands:

1. `ask`: Ask a single question and get a response
2. `chat`: Start an interactive chat session
3. `stream`: Stream a response in real-time
4. `config`: View or update configuration settings

#### Common Options

Each command supports various options to customize the behavior of the LLM:

- `--max-tokens <number>`: Maximum number of tokens to generate (default: 256)
- `--temperature <float>`: Controls randomness (0-1, default: 0.7)
- `--top-p <float>`: Nucleus sampling parameter (0-1, default: 1)
- `--top-k <number>`: Top-k sampling parameter (1-1000, default: 250)
- `--system <string>`: System message to set context
- `--file <path>`: Path to input file
- `--output <path>`: Path to output file
- `--format <type>`: Output format (json, markdown, text)
- `--provider <name>`: LLM provider (anthropic, openai)
- `--model <name>`: Specific model to use
  

> Imagine you're baking a cake, but instead of a regular recipe, you're using a magical oven that can create any cake you want. The parameters in AI language models are like the settings on this magical oven.
> 
> - The "max-tokens" is like setting a timer for how long the oven should run - it determines how much text the AI will generate.
> - The "temperature" is like adjusting the oven's heat - higher values make the AI more creative but potentially less accurate, while lower values make it more predictable.
> - "Top-p" and "top-k" are like filters that decide which ingredients the oven can use - they help control the variety of words the AI chooses from.
> - The "system" message is like giving the oven a theme for the cake, setting the overall context.
> - The "file" and "output" options are like choosing where to get your ingredients and where to put the finished cake.
> - The "format" is like deciding if you want your cake sliced, whole, or as cupcakes - it determines how the AI's response is presented.
> - Finally, the "provider" and "model" are like choosing which brand and type of magical oven you want to use - different ones might be better for different kinds of cakes.
> 
> All these settings work together to help you get the exact kind of AI-generated text you're looking for, just like how different oven settings help you bake the perfect cake.


Explanation of top-p and top-k:

> ## Top-p and Top-k Sampling
> 
> These are methods to control text generation in language models:
> 
> ### Top-p (Nucleus Sampling)
> - Selects from tokens whose cumulative probability exceeds threshold p
> - Dynamic: adapts to probability distribution
> - Example: p = 0.9 considers tokens up to 90% cumulative probability
> 
> ### Top-k Sampling
> - Selects from k most probable tokens
> - Fixed: always considers same number of options
> - Example: k = 50 considers only top 50 most likely tokens
> 
> ### Key Differences
> - Top-p is more flexible, adjusting to context
> - Top-k uses a fixed cutoff regardless of probabilities
> - Lower values: more focused output
> - Higher values: more diverse, creative responses
> 
> Often used together to balance coherence and creativity in text generation.


### Configuration

Use the `config` command to manage your QLLM settings:

```bash
qllm config --show
qllm config --set-profile <profile_name>
qllm config --set-region <aws_region>
qllm config --set-model <model_name>
qllm config --set-provider <provider_name>
```

Available model aliases for AWS Bedrock Anthropic:
- `sonnet`: Claude 3 Sonnet
- `sonnet35`: Claude 3.5 Sonnet
- `haiku`: Claude 3 Haiku (default)
- `opus`: Claude 3 Opus

## 💡 Examples and Use Cases

### Generate a Short Story

```bash
qllm ask "Write a 100-word story about a time traveler" --max-tokens 150
```

### Analyze Code

```bash
qllm stream "Explain the following code: function fibonacci(n) { if (n <= 1) return n; return fibonacci(n - 1) + fibonacci(n - 2); }" --format markdown
```

### Interactive Coding Assistant

```bash
qllm chat --system "You are a helpful coding assistant. Provide code examples and explanations."
```

### Batch Processing

```bash
qllm ask --file input.txt --output results.json --format json
```

### Customizing Output

```bash
qllm ask "Summarize the benefits of exercise" --max-tokens 100 --temperature 0.9 --format markdown
```

## 🗂 Project Structure

```
qllm/
├── src/
│   ├── commands/     # Implementation of CLI commands
│   ├── config/       # Configuration management
│   ├── helpers/      # Utility functions
│   ├── providers/    # LLM provider integrations
│   ├── utils/        # General utility functions
│   └── qllm.ts       # Main entry point
├── .env              # Environment variables
├── package.json      # Project dependencies and scripts
└── README.md         # Project documentation
```

## 🔧 Dependencies

- `@anthropic-ai/bedrock-sdk`: SDK for Anthropic's Bedrock models
- `commander`: Command-line interface creation
- `dotenv`: Environment variable management
- `prompts`: Interactive command-line user interfaces
- `winston`: Logging library

(See `package.json` for a full list of dependencies and their versions)

## 🤝 Contributing

We welcome contributions to QLLM! Here's how you can help:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

Please ensure your code adheres to our coding standards:
- Use TypeScript for all new files
- Follow the existing code style (we use ESLint and Prettier)
- Write unit tests for new features
- Update documentation as necessary

## 🧪 Testing

We use Jest for unit testing. To run the test suite:

```bash
npm test
```

When adding new features, please include appropriate test coverage. Test files should be placed in a `__tests__` directory adjacent to the code being tested.

## 📦 Deployment

QLLM is designed to be used as a local CLI tool. To create a packaged version for distribution:

```bash
npm pack
```

This will create a `.tgz` file that can be installed globally:

```bash
npm install -g qllm-x.y.z.tgz
```

After installation, you can use QLLM commands directly from your terminal.

## 🔍 Troubleshooting

- **API Key Issues**: Ensure your AWS credentials are correctly set up using `aws configure`.
- **Model Not Found**: Verify you're using a supported model name and the correct provider.
- **Rate Limiting**: If you encounter rate limits, try reducing the frequency of requests or upgrading your API plan.

For more issues, please check our GitHub Issues page or submit a new issue.

## ❓ Frequently Asked Questions

1. **Q: How do I update QLLM?**
   A: Run `npm update -g qllm` to update to the latest version.

2. **Q: Can I use QLLM in my scripts?**
   A: Yes, QLLM can be easily integrated into shell scripts or other automation tools.

3. **Q: Is my data secure when using QLLM?**
   A: QLLM does not store any of your prompts or responses. However, please review the privacy policies of the LLM providers you're using.

## 🗺 Roadmap

- [X] Add support for custom prompts and templates
   - [X] Ask for variable in the console if the variable are not set in the template
   - [X] Support include
   - [ ] Add support for output variables
   - [ ] Add support for worflow
- [X] Integrate Ollama for local model support
- [ ] Implement AI agent capabilities
- [ ] Expand provider support to include more LLM services
- [ ] Add safe code interpreter
- [ ] Multi-Modal Input and Output
- [ ] Prompt libraries and sharing
- [ ] Custom Workflows and Pipelines, Enable users to chain multiple LLM calls into a single workflow
- [ ] API Integration 
- [ ] Advanced Analytics and Monitoring
- [ ] Semantic Search and Knowledge Base
- [ ] Plugin Ecosystem
- [ ] AI-Assisted Prompt Engineering
- [ ] Ethical AI Features

## Changelog

The changelog is available at [CHANGELOG](./CHANGELOG.md)

## 📄 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to the Anthropic team for their amazing Claude models
- Inspired by various CLI tools in the AI community
- Special thanks to all our contributors and users for their feedback and support

## 📞 Contact

- Project Maintainer: [@raphaelmansuy](https://github.com/raphaelmansuy)
- Project Homepage: https://github.com/raphaelmansuy/qllm
- Bug Reports: https://github.com/raphaelmansuy/qllm/issues

---

Made with ❤️ by the QLLM team. Happy prompting!
