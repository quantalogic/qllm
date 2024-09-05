# QLLM: Quantalogic Large Language Model CLI & AI Toolbox 🚀

## Table of Contents

1. [Introduction](#1-introduction)
2. [Features](#2-features)
3. [Installation](#3-installation)
4. [Configuration](#4-configuration)
5. [Usage](#5-usage)
6. [Advanced Features](#6-advanced-features)
7. [Command Reference](#7-command-reference)
8. [Examples](#8-examples)
9. [Troubleshooting](#9-troubleshooting)
10. [Contributing](#10-contributing)
11. [License](#11-license)
12. [Acknowledgements](#12-acknowledgements)

## 1. Introduction

Welcome to QLLM CLI, the ultimate command-line interface for seamless interaction with Large Language Models (LLMs). Crafted with passion by @quantalogic, QLLM CLI revolutionizes the way you engage with AI, offering a unified platform that supports multiple providers and empowers users with unparalleled flexibility.

In today's AI-driven landscape, QLLM CLI emerges as a game-changing solution for developers, researchers, and AI enthusiasts alike. Whether you're integrating AI into your workflow, exploring the frontiers of language models, or simply engaging in thought-provoking conversations with AI, QLLM CLI provides the robust toolkit you need.

Key Highlights:

-   Multi-provider support (OpenAI, Anthropic, and more)
-   Rich, interactive chat experiences with advanced conversation management
-   Efficient one-time question answering for quick insights
-   Cutting-edge image input capabilities for visual analysis tasks
-   Fine-grained control over model parameters for tailored responses
-   Comprehensive configuration options for a personalized experience

Embrace the future of AI interaction with QLLM CLI – your gateway to boundless possibilities in the world of language models.

## 2. Features

QLLM CLI boasts an impressive array of features designed to elevate your AI interaction experience:

1. **🌐 Multi-provider Support**: Effortlessly switch between LLM providers like OpenAI and Anthropic, leveraging the unique strengths of various models and facilitating comparative analysis.

2. **💬 Interactive Chat Sessions**: Immerse yourself in dynamic, context-aware conversations with LLMs, complete with robust conversation history management.

3. **❓ One-time Question Answering**: Quickly obtain answers to standalone queries without the need for a full chat session.

4. **🖼️ Image Input Support**: Analyze images from multiple sources:

    - Local files on your system
    - URLs pointing to online images
    - Images from your clipboard
    - Screenshots captured directly through the CLI

5. **🎛️ Customizable Model Parameters**: Fine-tune AI behavior with adjustable settings:

    - Temperature
    - Max tokens
    - Top P
    - Frequency penalty
    - Presence penalty
    - Stop sequences

6. **🗂️ Conversation Management**: Efficiently save, list, load, and delete chat histories for easy reference and continuation of previous interactions.

7. **📋 Provider and Model Listing**: Easily view available providers and their associated models to make informed choices.

8. **🔄 Streaming Responses**: Experience real-time output for long-form content, enhancing interactivity.

9. **💾 Output to File**: Save AI responses directly to your filesystem for future reference or processing.

10. **⚙️ Configurable Settings**: Tailor your QLLM CLI experience with a robust configuration system for managing defaults and API keys.

11. **🖥️ Cross-platform Compatibility**: Enjoy a consistent experience across Windows, macOS, and Linux.

12. **📸 Screenshot Capture**: Take screenshots directly from the CLI for immediate AI analysis.

13. **🎨 Syntax Highlighting**: Benefit from colorized output for improved readability and a more pleasant user experience.

14. **🛡️ Error Handling and Validation**: Robust error checking and input validation ensure smooth operation and helpful error messages.

15. **🧩 Extensible Architecture**: Modular design facilitates easy addition of new features and providers in the future.

## 3. Installation

To embark on your QLLM CLI journey, ensure you have Node.js (version 14 or higher) installed on your system. Then, execute the following command:

- **Install QLLM CLI globally:**
```
npm install -g qllm
```

This global installation makes the `qllm` command readily available in your terminal.

Verify the installation with:

```
qllm --version
```

You should see the version number (e.g., 1.8.0) displayed, confirming a successful installation.

## 4. Configuration

Before diving into the world of AI interactions, configure QLLM CLI with your API keys for the desired LLM providers. QLLM CLI offers flexible configuration management:

### Interactive Configuration

Initiate the interactive configuration mode:

```
qllm configure
```

This guided process helps you set up API keys and default preferences across several sections:

1. Provider Settings
    - Default Provider
    - Default Model
2. Model Parameters
    - Temperature
    - Max Tokens
    - Top P
    - Frequency Penalty
    - Presence Penalty
3. Other Settings
    - Log Level
    - Custom Prompt Directory
    - Stop Sequence

### Command-line Configuration

Usage: `qllm configure [options]`

Configure QLLM CLI settings.

Options:
-l, --list List all configuration settings
-s, --set <key=value> Set a configuration value
-g, --get <key> Get a configuration value
-h, --help Display help for command

This command allows you to manage configuration settings for the QLLM CLI.

Examples:

```
qllm configure --set provider=openai
qllm configure --set model=gpt-4
```

### Viewing Current Configuration

Display your current settings at any time:

```
qllm configure --list
```

This command shows all current settings, with API keys masked for security.

### Configuration File

QLLM CLI stores its configuration in a JSON file located at `~/.qllmrc`. While manual editing is possible, using the `configure` command is recommended for proper formatting and validation.

## 5. Usage

QLLM CLI offers a variety of commands for interacting with LLMs. Here's an overview of the primary usage patterns:

### Running Templates

QLLM CLI allows you to run templates directly. This is now the default behavior when no specific command is provided:

```
qllm <template_url>
```

For example:

```
qllm https://raw.githubusercontent.com/quantalogic/qllm/main/prompts/chain_of_tought_leader.yaml
```

The `run` command supports various options:

-   `-p, --provider <provider>`: Specify the LLM provider (default: openai)
-   `-m, --model <model>`: Choose a specific model
-   `-t, --max-tokens <number>`: Set maximum tokens for the response
-   `--temperature <number>`: Adjust output randomness (0.0 to 1.0)
-   `-s, --stream`: Stream the response in real-time
-   `-o, --output <file>`: Save the response to a file
-   `-i, --image <path>`: Include image files or URLs (can be used multiple times)
-   `--use-clipboard`: Use an image from your clipboard
-   `--screenshot <number>`: Capture and include a screenshot
-   `--system-message <message>`: Prepend a system message to the conversation

#### Using with Piped Input

```
echo "Explain quantum computing" | qllm ask
```

or

```
cat article.txt | qllm ask "Summarize this text"
```

#### Image Analysis

```
qllm ask "Describe this image" -i path/to/image.jpg
```

#### Streaming Responses

```
qllm ask "Write a short story about AI" -s
```

#### Saving Output to File

```
qllm ask "Explain the theory of relativity" -o relativity_explanation.txt
```

### Interactive Chat

Start an interactive chat session:

```
qllm chat
```

In chat mode, utilize various commands to manage your conversation:

-   `/help`: Display available commands
-   `/stop`: End the chat session
-   `/new`: Start a new conversation
-   `/save`: Save the current conversation
-   `/load`: Load a saved conversation
-   `/list`: Show all messages in the current conversation
-   `/clear`: Clear the current conversation
-   `/models`: List available models for the current provider
-   `/providers`: List available providers
-   `/options`: Display current chat options
-   `/set <option> <value>`: Set a chat option
-   `/image <path>`: Add an image to the conversation
-   `/clearimages`: Clear all images from the buffer
-   `/listimages`: List all images in the buffer
-   `/removeimage <path>`: Remove a specific image from the buffer

The `chat` command also supports options similar to the `ask` command for setting the provider, model, and other parameters.

### Listing Providers and Models

View available providers:

```
qllm list providers
```

List models for a specific provider:

```
qllm list models openai
```

The `list models` command offers several options:

-   `-f, --full`: Show full model details
-   `-s, --sort <field>`: Sort models by field (id, created)
-   `-r, --reverse`: Reverse sort order
-   `-c, --columns <columns>`: Select specific columns to display (comma-separated: id,description,created)

### Configuration Management

Manage your settings at any time:

```
qllm configure --set model gpt-4
qllm configure --get logLevel
qllm configure --list
```

## 6. Advanced Features

QLLM CLI offers sophisticated features for power users:

### Image Input

Include images in your queries for visual analysis:

```
qllm ask "Describe this image" -i path/to/image.jpg
```

QLLM CLI supports multiple image input methods:

1. Local file paths
2. URLs to online images
3. Images from the clipboard
4. Screenshots captured directly by the CLI

Use an image from your clipboard:

```
qllm ask "What's in this image?" --use-clipboard
```

Capture and use a screenshot:

```
qllm ask "Analyze this screenshot" --screenshot 0
```

Combine multiple image inputs:

```
qllm ask "Compare these images" -i image1.jpg -i image2.jpg --use-clipboard
```

### Streaming Responses

For long-form content, stream the output in real-time:

```
qllm ask "Write a short story about AI" -s
```

This feature allows you to see the AI's response as it's generated, providing a more interactive experience.

### Saving Output to File

Save the LLM's response directly to a file:

```
qllm ask "Explain the theory of relativity" -o relativity_explanation.txt
```

This is particularly useful for long responses or when you want to process the output further.

### Conversation Management

QLLM CLI provides robust conversation management features in chat mode:

-   Save conversations: `/save`
-   List saved conversations: `/conversations`
-   Load a saved conversation: `/load <conversation_id>`
-   Delete a conversation: `/delete <conversation_id>`
-   Clear the current conversation: `/clear`

These features allow you to maintain context across multiple chat sessions and organize your interactions with the AI.

## 7. Command Reference

Quick reference of main QLLM CLI commands:

-   `qllm ask <question>`: Ask a one-time question
-   `qllm chat`: Start an interactive chat session
-   `qllm configure`: Configure QLLM CLI settings
-   `qllm list providers`: List all available providers
-   `qllm list models <provider>`: List models for a specific provider

Each command supports various options. Use `qllm <command> --help` for detailed information on each command's options.

## 8. Examples

Explore these example use cases for QLLM CLI:

1. **Creative Writing Assistance:**
    ```
    qllm ask "Write a haiku about artificial intelligence"
    ```

2. **Code Explanation:**
    ```
    qllm ask "Explain this Python code: [paste your code here]"
    ```

3. **Image Analysis:**
    ```
    qllm ask "Describe the contents of this image" -i vacation_photo.jpg
    ```

4. **Interactive Problem-Solving:**
    ```
    qllm chat -p anthropic -m claude-2
    ```

5. **Data Analysis:**
    ```
    qllm ask "Analyze this CSV data: [paste CSV here]" --max-tokens 500
    ```

6. **Language Translation:**
    ```
    qllm ask "Translate 'Hello, world!' to French, Spanish, and Japanese"
    ```

7. **Document Summarization:**
    ```
    qllm ask "Summarize this article: [paste article text]" -o summary.txt
    ```

8. **Character Creation:**
    ```
    qllm ask "Create a detailed character profile for a sci-fi novel"
    ```

9. **Recipe Generation:**
    ```
    qllm ask "Create a recipe using chicken, spinach, and feta cheese"
    ```

10. **Workout Planning:**
    ```
    qllm ask "Design a 30-minute HIIT workout routine"
    ```

## 9. Troubleshooting

If you encounter issues while using QLLM CLI, try these troubleshooting steps:

1. Verify your API keys are correctly configured:

    ```
    qllm configure --list
    ```

    Ensure that your API keys are set for the providers you're trying to use.

2. Check your internet connection. QLLM CLI requires an active internet connection to communicate with LLM providers.

3. Update to the latest version of QLLM CLI:

    ```
    npm update -g qllm
    ```

4. Ensure you're using a supported Node.js version (14 or higher).

5. For image input issues, verify that the image files exist and are in a supported format (jpg, jpeg, png, gif, bmp, webp).

6. For clipboard-related issues, ensure your system's clipboard is functioning correctly.

7. If you're experiencing problems with a specific provider or model, try using a different one to isolate the issue.

If problems persist, please open an issue on our GitHub repository with a detailed description of the problem, steps to reproduce it, and any relevant error messages or logs.

## 10. Contributing

We warmly welcome contributions to QLLM CLI! To contribute, please follow these steps:

1. Fork the repository on GitHub.
2. Clone your forked repository to your local machine.
3. Create a new branch for your feature or bug fix.
4. Make your changes, adhering to the existing code style and conventions.
5. Write tests for your changes if applicable.
6. Run the existing test suite to ensure your changes don't introduce regressions:
    ```
    npm test
    ```
7. Commit your changes with a clear and descriptive commit message.
8. Push your changes to your fork on GitHub.
9. Create a pull request from your fork to the main QLLM CLI repository.

Please ensure your code adheres to our coding standards:

-   Use TypeScript for type safety.
-   Follow the existing code style (we use Prettier for formatting).
-   Write unit tests for new features.
-   Update documentation as necessary, including this README if you're adding or changing features.

We use GitHub Actions for CI/CD, so make sure your changes pass all automated checks.

## 11. License

This project is licensed under the Apache License, Version 2.0. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

## 12. Acknowledgements

We extend our heartfelt gratitude to the developers and maintainers of:

-   [Commander.js](https://github.com/tj/commander.js/): For robust command-line interfaces
-   [Prompts](https://github.com/terkelg/prompts): For interactive command-line user interfaces
-   [Kleur](https://github.com/lukeed/kleur): For adding vibrant colors to our CLI output
-   [Nanospinner](https://github.com/usmanyunusov/nanospinner): For elegant loading spinners

## Why We Created QuantaLogic

The potential of generative AI is immense, yet its practical application remains a challenge for many organizations. At QuantaLogic, we believe that the true value of AI lies not in its theoretical capabilities, but in its ability to solve real-world business problems efficiently and effectively.

We created QuantaLogic because we identified a significant gap between the advanced AI models developed by industry leaders like OpenAI, Anthropic, and Mistral, and their practical implementation in everyday business processes. Our mission is to bridge this gap, making the power of generative AI accessible and actionable for businesses of all sizes.

QLLM CLI is a testament to this mission, providing a versatile and user-friendly tool that empowers users to harness the full potential of various LLMs through a single, unified interface. By simplifying the interaction with these powerful AI models, we aim to accelerate innovation and drive efficiency across industries.

Join us in our journey to democratize AI and unlock its transformative potential for businesses worldwide.
