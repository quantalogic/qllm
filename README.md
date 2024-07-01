# QLLM: Multi-Provider LLM Command CLI

QLLM is a powerful and flexible Command Line Interface (CLI) for interacting with multiple Large Language Model (LLM) providers. Built with love by [@quantalogic](https://github.com/quantalogic), QLLM simplifies the process of leveraging state-of-the-art language models in your projects and workflows.

## 🚀 Key Features

- Multi-provider support (currently featuring Anthropic's Claude models and OpenAI)
- Interactive chat mode for continuous conversations
- Streaming responses for real-time output
- Configurable model parameters (temperature, top-p, top-k, etc.)
- File input/output support for batch processing
- Customizable output formats (JSON, Markdown, plain text)
- Easy-to-use configuration management

## 📚 Table of Contents

- [Quick Start](#-quick-start)
- [Detailed Documentation](#-detailed-documentation)
- [Examples and Use Cases](#-examples-and-use-cases)
- [Project Structure](#-project-structure)
- [Dependencies](#-dependencies)
- [Contributing](#-contributing)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)
- [Contact](#-contact)

## 🏁 Quick Start

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- AWS account with Bedrock access (for Anthropic models)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/raphaelmansuy/qllm.git
   cd qllm
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your AWS credentials:
   ```bash
   aws configure
   ```

4. Create a `.env` file in the project root and add your configuration:
   ```
   AWS_PROFILE=your_profile_name
   AWS_REGION=your_aws_region
   ```

### Basic Usage

Ask a question:
```bash
 ts-node src/qllm.ts ask --max-tokens 150  --provider anthropic --profile bedrock --region us-east-1 --model haiku
```

Start an interactive chat session:
```bash
 ts-node src/qllm.ts chat --max-tokens 150  --provider anthropic --profile bedrock --region us-east-1 --model haiku
```

Stream a response:
```bash
 ts-node src/qllm.ts stream "Write a 100-word story about a time traveler" --max-tokens 150  --provider anthropic --profile bedrock --region us-east-1 --model haiku
```

## 📚 Detailed Documentation

### Command Structure

QLLM offers four main commands:

1. `ask`: Ask a single question and get a response
2. `chat`: Start an interactive chat session
3. `stream`: Stream a response in real-time
4. `config`: View or update configuration settings

Each command supports various options to customize the behavior of the LLM:

- `--max-tokens`: Maximum number of tokens to generate (default: 256)
- `--temperature`: Controls randomness (0-1, default: 0.7)
- `--top-p`: Nucleus sampling parameter (0-1, default: 1)
- `--top-k`: Top-k sampling parameter (1-1000, default: 250)
- `--system`: System message to set context
- `--file`: Path to input file
- `--output`: Path to output file
- `--format`: Output format (json, markdown, text)

### Configuration

Use the `config` command to manage your QLLM settings:

```bash
npm run cli config --show
npm run cli config --set-profile your_profile
npm run cli config --set-region your_region
npm run cli config --set-model sonnet
npm run cli config --set-provider anthropic

```

Available model aliases for AWS Bedrock Anthropic:

- `sonnet`: Claude 3 Sonnet
- `sonnet35`: Claude 3.5 Sonnet
- `haiku`: Claude 3 Haiku (default)
- `opus`: Claude 3 Opus

## 💡 Examples and Use Cases

### Generate a Short Story

```bash
npm run cli ask "Write a 100-word story about a time traveler" --max-tokens 150
```

### Analyze Code

```bash
npm run cli stream "Explain the following code: function fibonacci(n) { if (n <= 1) return n; return fibonacci(n - 1) + fibonacci(n - 2); }" --format markdown
```

### Interactive Coding Assistant

```bash
npm run cli chat --system "You are a helpful coding assistant. Provide code examples and explanations."
```

## 🗂 Project Structure

```
qllm/
├── src/
│   ├── commands/
│   ├── config/
│   ├── helpers/
│   ├── providers/
│   ├── utils/
│   └── qllm.ts
├── .env
├── package.json
└── README.md
```

## 🔧 Dependencies

- Node.js (v14+)
- npm packages:
  - @anthropic-ai/bedrock-sdk
  - commander
  - dotenv
  - prompts
  - winston
  - (see package.json for full list)

## 🤝 Contributing

We welcome contributions to QLLM! Here's how you can help:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

Please ensure your code adheres to our coding standards and includes appropriate tests.

## 🧪 Testing

To run the test suite:

```bash
npm test
```

We use Jest for unit testing. Please ensure all new features are covered by tests.

## 📦 Deployment

QLLM is designed to be used as a local CLI tool. However, you can package it for distribution:

```bash
npm pack
```

This will create a `.tgz` file that can be installed globally:

```bash
npm install -g qllm-1.0.0.tgz
```

## 🗺 Roadmap

- [ ] Add support for custom prompts and templates
- [ ] Add support for Ollama 
- [ ] Add support for Agents

## 📄 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to the Anthropic team for their amazing Claude models
- Inspired by various CLI tools in the AI community

## 📞 Contact

- Project Maintainer: [@raphaelmansuy](https://github.com/raphaelmansuy)
- Project Homepage: https://github.com/raphaelmansuy/qllm

---

Made with ❤️ by the QLLM team. Happy prompting!
