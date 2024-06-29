# Anthropic Bedrock CLI 🤖

Anthropic Bedrock CLI Banner

Anthropic Bedrock CLI is a powerful command-line interface for interacting with Anthropic's language models through AWS Bedrock. Seamlessly integrate advanced AI capabilities into your workflow with simple commands.

## 🚀 Key Features

- Interactive chat sessions with AI models
- Stream responses in real-time
- Ask one-off questions to the AI
- Support for multiple Anthropic models (Claude 3 Sonnet, Haiku, Opus)
- Configurable output formats (JSON, Markdown, plain text)
- AWS profile and region management
- Customizable model parameters (tokens, temperature, etc.)

## 📦 Quick Start

### Prerequisites

- Node.js (v14 or later)
- AWS account with Bedrock access
- AWS CLI configured with appropriate credentials

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/anthropic-bedrock-cli.git
   cd anthropic-bedrock-cli
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your AWS profile and region.

4. Run the CLI:
   ```bash
   npm run cli -- --help
   ```

### Basic Usage

Start a chat session:
```bash
npm run cli -- chat
```

Ask a question:
```bash
npm run cli -- ask "What is the capital of France?"
```

Stream a response:
```bash
npm run cli -- stream "Explain quantum computing in simple terms"
```

## 📘 Detailed Documentation

### Available Commands

- `chat`: Start an interactive chat session
- `ask`: Ask a one-off question
- `stream`: Stream a response from the AI
- `config`: Display or update configuration

### Global Options

- `-p, --profile <profile>`: AWS profile to use
- `-r, --region <region>`: AWS region to use
- `--modelid <modelid>`: Specific model ID to use
- `--model <model>`: Model alias to use (sonnet, sonnet35, haiku, opus)

### Command-Specific Options

Most commands support the following options:

- `-t, --max-tokens <tokens>`: Maximum number of tokens to generate
- `--temperature <temperature>`: Temperature for response generation
- `--top-p <value>`: Top P for response generation
- `--top-k <value>`: Top K for response generation
- `-s, --system <message>`: System message to set context
- `-f, --file <path>`: Path to input file
- `-o, --output <path>`: Path to output file
- `--format <format>`: Output format (json, markdown, text)

For full details on each command and its options, use the `--help` flag:

```bash
npm run cli -- <command> --help
```

## 💡 Examples and Use Cases

### Interactive Chat Session

```bash
npm run cli -- chat --model haiku
```

This starts an interactive chat session using the Claude 3 Haiku model. Type your messages and receive AI responses in real-time.

### Answering Questions from a File

```bash
npm run cli -- ask -f questions.txt --output answers.md --format markdown
```

This reads questions from `questions.txt`, generates answers using the default AI model, and saves the output in Markdown format to `answers.md`.

### Streaming a Long-Form Response

```bash
npm run cli -- stream "Write a short story about a time traveler" --max-tokens 1000 --temperature 0.8
```

This generates a creative short story with increased randomness (higher temperature) and streams the output to the console.

## 🗂️ Project Structure

```
anthropic-bedrock-cli/
├── src/
│   ├── commands/
│   │   ├── ask.ts
│   │   ├── chat.ts
│   │   ├── config.ts
│   │   └── stream.ts
│   ├── helpers/
│   │   ├── messageHelper.ts
│   │   └── outputHelper.ts
│   ├── anthropic-client.ts
│   ├── cli.ts
│   ├── config.ts
│   ├── credentials.ts
│   ├── options.ts
│   └── utils.ts
├── package.json
└── tsconfig.json
```

## 🛠️ Dependencies

- Node.js (v14+)
- TypeScript
- Commander.js
- Anthropic Bedrock SDK
- AWS SDK
- dotenv
- prompts
- cli-spinner

## 🤝 Contributing

We welcome contributions to the Anthropic Bedrock CLI! Here's how you can help:

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

## 🚀 Deployment

This CLI tool is designed to be run locally or integrated into your own projects. There's no specific deployment process, but you can publish it to npm if desired:

```bash
npm publish
```

## 🗓️ Roadmap

- [ ] Add support for more Anthropic models as they become available
- [ ] Implement conversation history management
- [ ] Create a web-based UI for the CLI
- [ ] Add support for other AI providers through Bedrock

## 📄 License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Anthropic for their amazing AI models
- AWS for the Bedrock platform
- The open-source community for the various libraries used in this project

## 📞 Contact

For questions, suggestions, or issues, please open an issue on the GitHub repository or reach out to the maintainers:

- GitHub Issues: [https://github.com/yourusername/anthropic-bedrock-cli/issues](https://github.com/yourusername/anthropic-bedrock-cli/issues)
- Email: maintainer@example.com

Join our community:
- Discord: [https://discord.gg/anthropic-bedrock-cli](https://discord.gg/anthropic-bedrock-cli)

---

Happy coding with Anthropic Bedrock CLI! 🎉

