
# qllm-cli

## Multi-Provider LLM Command CLI

qllm-cli is a powerful Command Line Interface (CLI) tool designed for interacting with various Large Language Model (LLM) providers. It offers a unified interface to leverage different LLM capabilities, making it easier for developers and AI enthusiasts to work with multiple providers seamlessly.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)
  - [ask](#ask)
- [Configuration](#configuration)
- [Supported Providers](#supported-providers)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Installation

To install qllm-cli globally, use npm:

```bash
npm install -g qllm-cli
```

Or, if you prefer to use it locally in your project:

```bash
npm install qllm-cli
```

## Usage

After installation, you can use the `qllm` command in your terminal:

```bash
qllm [command] [options]
```

For help, use:

```bash
qllm --help
```

## Commands

### ask

The `ask` command allows you to send a question to an LLM provider and receive a response.

Usage:

```bash
qllm ask <question> [options]
```

Options:

- `-p, --provider <provider>`: LLM provider to use (default: "openai")
- `-m, --model <model>`: Specific model to use
- `-t, --max-tokens <number>`: Maximum number of tokens to generate (default: "1024")
- `--temperature <number>`: Temperature for response generation (default: "0.7")
- `-s, --stream`: Stream the response
- `-o, --output <file>`: Output file for the response
- `--system-message <message>`: System message to prepend to the conversation

Example:

```bash
qllm ask "What is the capital of France?" --provider openai --model gpt-4 --max-tokens 100
```

## Configuration

qllm-cli uses a configuration file to store default settings and API keys. The default location for this file is `~/.qllmrc`.

You can specify a custom configuration file using the `--config` option:

```bash
qllm --config /path/to/custom/config.json [command]
```

Example configuration file:

```json
{
  "defaultProvider": "openai",
  "apiKeys": {
    "openai": "your-openai-api-key",
    "anthropic": "your-anthropic-api-key"
  },
  "logLevel": "info"
}
```

## Supported Providers

qllm-cli currently supports the following LLM providers:

- OpenAI
- Anthropic
- AWS Bedrock (Anthropic models)
- Ollama
- Groq

To use a specific provider, ensure you have the necessary API keys configured in your `.qllmrc` file or set as environment variables.

## Examples

1. Ask a question using the default provider:

```bash
qllm ask "Explain quantum computing in simple terms"
```

2. Use a specific provider and model:

```bash
qllm ask "Write a short poem about AI" --provider anthropic --model claude-3-opus-20240229
```

3. Stream the response and save it to a file:

```bash
qllm ask "Describe the process of photosynthesis" --stream --output photosynthesis.txt
```

4. Use a system message to set context:

```bash
qllm ask "What's the next step?" --system-message "You are an expert in software development best practices"
```

## Troubleshooting

If you encounter any issues while using qllm-cli, try the following:

1. Ensure you have the latest version installed:
   ```bash
   npm update -g qllm-cli
   ```

2. Check your configuration file for any misconfigurations.

3. Verify that you have the necessary API keys for the provider you're trying to use.

4. If you're still having problems, please open an issue on our GitHub repository with a detailed description of the problem and steps to reproduce it.

## Contributing

Contributions to qllm-cli are welcome! Please feel free to submit pull requests, create issues, or suggest new features.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for details.

---

Created with ❤️ by [QuantaLogic](https://quantalogic.com)
