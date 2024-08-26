# QLLM CLI

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
   - [Asking Questions](#asking-questions)
   - [Interactive Chat](#interactive-chat)
   - [Listing Providers and Models](#listing-providers-and-models)
6. [Advanced Features](#advanced-features)
7. [Command Reference](#command-reference)
8. [Examples](#examples)
9. [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)
11. [License](#license)
12. [Acknowledgements](#acknowledgements)

## 1. Introduction

QLLM CLI is a powerful command-line interface tool that provides seamless interaction with various Large Language Models (LLMs) through a unified interface. It supports multiple providers, offering flexibility and choice in your AI-powered conversations and tasks.

QLLM CLI is designed to be user-friendly, efficient, and feature-rich, catering to both casual users and AI enthusiasts who want to harness the power of LLMs directly from their terminal.

## 2. Features

- Multi-provider support (OpenAI, Anthropic, and more)
- Interactive chat sessions with LLMs
- One-time question answering
- Image input support (local files, URLs, clipboard, and screenshots)
- Customizable model parameters
- Conversation management (save, list, load, delete)
- Provider and model listing
- Streaming responses
- Output to file
- Configurable settings

## 3. Installation

To install QLLM CLI, ensure you have Node.js (version 14 or higher) installed on your system. Then, run the following command:

```bash
npm install -g qllm
```

This will install QLLM CLI globally on your system, making the `qllm` command available in your terminal.

## 4. Configuration

Before using QLLM CLI, you need to configure it with your API keys for the LLM providers you intend to use. Run the following command to enter the interactive configuration mode:

```bash
qllm configure
```

This will guide you through setting up your API keys and default preferences. Alternatively, you can set configuration options individually:

```bash
qllm configure --set provider openai
qllm configure --set openai_api_key your_api_key_here
```

You can view your current configuration at any time:

```bash
qllm configure --list
```

## 5. Usage

### Asking Questions

To ask a one-time question to an LLM, use the `ask` command:

```bash
qllm ask "What is the capital of France?"
```

You can specify a provider and model:

```bash
qllm ask "Explain quantum computing" -p openai -m gpt-4
```

### Interactive Chat

To start an interactive chat session, use the `chat` command:

```bash
qllm chat
```

In chat mode, you can use various commands to manage your conversation:

- `/help`: Display available commands
- `/stop`: End the chat session
- `/new`: Start a new conversation
- `/list`: Show all messages in the current conversation

### Listing Providers and Models

To see available providers:

```bash
qllm list providers
```

To list models for a specific provider:

```bash
qllm list models openai
```

## 6. Advanced Features

QLLM CLI offers several advanced features:

### Image Input

You can include images in your queries:

```bash
qllm ask "Describe this image" -i path/to/image.jpg
```

### Streaming Responses

For long responses, you can stream the output:

```bash
qllm ask "Write a short story about AI" -s
```

### Saving Output to File

Save the LLM's response to a file:

```bash
qllm ask "Explain the theory of relativity" -o relativity_explanation.txt
```

## 7. Command Reference

Here's a quick reference of the main QLLM CLI commands:

- `qllm ask <question>`: Ask a one-time question
- `qllm chat`: Start an interactive chat session
- `qllm configure`: Configure QLLM CLI settings
- `qllm list providers`: List all available providers
- `qllm list models <provider>`: List models for a specific provider

For a full list of commands and options, run `qllm --help`.

## 8. Examples

Here are some example use cases for QLLM CLI:

1. Creative Writing Assistance:
   ```bash
   qllm ask "Write a poem about artificial intelligence"
   ```

2. Code Explanation:
   ```bash
   qllm ask "Explain this Python code: [paste your code here]"
   ```

3. Image Analysis:
   ```bash
   qllm ask "What's in this image?" -i screenshot.png
   ```

4. Interactive Debugging Session:
   ```bash
   qllm chat -p anthropic -m claude-2
   ```

## 9. Troubleshooting

If you encounter issues while using QLLM CLI, try the following:

1. Ensure your API keys are correctly configured
2. Check your internet connection
3. Verify that you're using the latest version of QLLM CLI
4. Look for error messages in the CLI output

If problems persist, please open an issue on our GitHub repository.

## 10. Contributing

We welcome contributions to QLLM CLI! If you'd like to contribute, please:

1. Fork the repository
2. Create a new branch for your feature
3. Commit your changes
4. Push to your branch
5. Create a new Pull Request

Please ensure your code adheres to our coding standards and includes appropriate tests.

## 11. License

QLLM CLI is released under the MIT License. See the LICENSE file for more details.

## 12. Acknowledgements

QLLM CLI is built upon several open-source libraries and APIs. We'd like to thank the developers and maintainers of:

- Commander.js
- Prompts
- Kleur
- Nanospinner
- And all the LLM providers whose APIs we integrate

Your contributions to the open-source community make projects like QLLM CLI possible.

---

This README provides a comprehensive overview of the QLLM CLI tool. It covers installation, configuration, basic and advanced usage, troubleshooting, and more. You may want to expand certain sections with more detailed information or examples as needed. Remember to keep the README updated as you add new features or make significant changes to the tool.
