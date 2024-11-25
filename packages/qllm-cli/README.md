# QLLM: Quantalogic Large Language Model CLI & AI Toolbox 🚀

![npm version](https://img.shields.io/npm/v/qllm)
![Stars](https://img.shields.io/github/stars/quantalogic/qllm)
![Forks](https://img.shields.io/github/forks/quantalogic/qllm)

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

Welcome to QLLM CLI, a powerful command-line interface for seamless interaction with Large Language Models (LLMs). QLLM CLI provides a unified platform that supports multiple providers and empowers users with extensive configuration options and features.

Key Highlights:

- Multi-provider support through qllm-lib integration
- Rich, interactive chat experiences with conversation management
- Efficient one-time question answering
- Advanced image input capabilities for visual analysis
- Fine-grained control over model parameters
- Comprehensive configuration system

## 2. Features

QLLM CLI offers a robust set of features designed for effective AI interaction:

1. **🌐 Multi-provider Support**: Seamlessly switch between LLM providers through qllm-lib integration.

2. **💬 Interactive Chat Sessions**: 
   - Context-aware conversations with history management
   - Real-time streaming responses
   - System message customization

3. **❓ One-time Question Answering**: Quick answers for standalone queries with the `ask` command.

4. **🖼️ Image Input Support**: Analyze images from multiple sources:
   - Local files (Supported formats: jpg, jpeg, png, gif, bmp, webp)
   - URLs pointing to online images
   - Clipboard images
   - Screen captures with display selection

5. **🎛️ Model Parameters**: Fine-tune AI behavior with:
   - Temperature (0.0 to 1.0)
   - Max tokens
   - Top P
   - Frequency penalty
   - Presence penalty
   - Stop sequences

6. **📋 Provider Management**:
   - List available providers
   - View supported models per provider
   - Configure default provider and model

7. **🔄 Response Handling**:
   - Stream responses in real-time
   - Save responses to files
   - Extract specific variables from responses

8. **⚙️ Configuration System**:
   - Interactive configuration setup
   - JSON-based configuration storage
   - Environment variable support

## 3. Installation

To use QLLM CLI, ensure you have Node.js installed on your system. Then install globally via npm:

```bash
npm install -g qllm
```

Verify the installation:

```bash
qllm --version
```

## 4. Configuration

QLLM CLI provides flexible configuration management through both interactive and command-line interfaces.

### Interactive Configuration

Run the interactive configuration wizard:

```bash
qllm configure
```

The wizard guides you through configuring:

1. **Provider Settings**
   - Default Provider
   - Default Model

2. **Model Parameters**
   - Temperature (0.0 to 1.0)
   - Max Tokens
   - Top P
   - Frequency Penalty
   - Presence Penalty
   - Stop Sequences

3. **Other Settings**
   - Log Level
   - Custom Prompt Directory

### Command-line Configuration

Set individual configuration values:

```bash
qllm configure --set <key=value>
```

View current configuration:

```bash
qllm configure --list
```

Get a specific setting:

```bash
qllm configure --get <key>
```

### Configuration File

Settings are stored in `~/.qllmrc` as JSON. While manual editing is possible, using the `configure` commands is recommended.

## 5. Usage

QLLM CLI supports three main interaction modes:

1. **Direct Questions**
```bash
qllm ask "What is the capital of France?"
```

2. **Interactive Chat**
```bash
qllm chat
```

3. **Template-based Execution**
```bash
qllm run template.yaml
```

### Image Analysis

Include images in your queries:

```bash
# Local file
qllm ask "What's in this image?" -i path/to/image.jpg

# URL
qllm ask "Describe this image" -i https://example.com/image.jpg

# Clipboard
qllm ask "Analyze this image" --use-clipboard

# Screenshot
qllm ask "What's on my screen?" --screenshot 1
```

### Response Options

Control output behavior:

```bash
# Save to file
qllm ask "Query" -o output.txt

# Disable streaming
qllm ask "Query" --no-stream

# Add system message
qllm ask "Query" --system-message "You are a helpful assistant"
```

## 6. Advanced Features

### Template-based Execution

QLLM CLI supports running predefined templates:

```bash
qllm run template.yaml
```

Template options:
- `-v, --variables`: Provide template variables in JSON format
- `-ns, --no-stream`: Disable response streaming
- `-o, --output`: Save response to file
- `-e, --extract`: Extract specific variables from response

### Chat Commands

In chat mode, use these commands:

- `/help`: Show available commands
- `/new`: Start new conversation
- `/save`: Save conversation
- `/load`: Load conversation
- `/list`: Show conversation history
- `/clear`: Clear conversation
- `/models`: List available models
- `/providers`: List providers
- `/options`: Show chat options
- `/set <option> <value>`: Set chat option
- `/image <path>`: Add image
- `/clearimages`: Clear image buffer
- `/listimages`: List images in buffer

### Provider and Model Management

List available providers:

```bash
qllm list providers
```

List models for a provider:

```bash
qllm list models <provider>
```

Options:
- `-f, --full`: Show full model details
- `-s, --sort <field>`: Sort by field (id, created)
- `-r, --reverse`: Reverse sort order
- `-c, --columns`: Select display columns

### Environment Variables

Configure providers using environment variables:

```bash
export OPENAI_API_KEY=your_key_here
export ANTHROPIC_API_KEY=your_key_here
```

### Piped Input Support

Use QLLM with piped input:

```bash
echo "Explain quantum computing" | qllm ask
cat article.txt | qllm ask "Summarize this:"
```

## 7. Command Reference

### Core Commands

```bash
qllm [template]              # Run a template or start ask mode if no template
qllm ask [question]         # Ask a one-time question
qllm chat                   # Start interactive chat session
qllm configure              # Configure settings
qllm list                   # List providers or models
```

### Global Options

```bash
-p, --provider <provider>   # LLM provider to use
-m, --model <model>        # Specific model to use
--max-tokens <number>      # Maximum tokens to generate
--temperature <number>     # Temperature for generation (0-1)
--log-level <level>       # Set log level (error, warn, info, debug)
```

### Ask Command Options

```bash
-i, --image <path>         # Include image file or URL (multiple allowed)
--use-clipboard           # Use image from clipboard
--screenshot <number>     # Capture screenshot from display
-ns, --no-stream         # Disable response streaming
-o, --output <file>      # Save response to file
-s, --system-message     # Set system message
```

### Configure Command Options

```bash
-l, --list               # List all settings
-s, --set <key=value>    # Set a configuration value
-g, --get <key>          # Get a configuration value
```

### List Command Options

```bash
list providers           # List available providers
list models <provider>   # List models for provider
  -f, --full            # Show full model details
  -s, --sort <field>    # Sort by field
  -r, --reverse         # Reverse sort order
  -c, --columns         # Select columns to display
```

### Template Options

```bash
-t, --type <type>        # Template source type (file, url, inline)
-v, --variables <json>   # Template variables in JSON format
-e, --extract <vars>     # Variables to extract from response
```

## 8. Examples

### Basic Usage

1. **Simple Questions**
```bash
# Direct question
qllm ask "What is quantum computing?"

# With system message
qllm ask "Explain like I'm 5: What is gravity?" --system-message "You are a teacher for young children"
```

2. **Interactive Chat**
```bash
# Start chat with default settings
qllm chat

# Start chat with specific provider and model
qllm chat -p openai -m gpt-4
```

### Working with Images

1. **Local Image Analysis**
```bash
# Analyze a single image
qllm ask "What's in this image?" -i photo.jpg

# Compare multiple images
qllm ask "What are the differences?" -i image1.jpg -i image2.jpg
```

2. **Screen Analysis**
```bash
# Capture and analyze screen
qllm ask "What's on my screen?" --screenshot 1

# Use clipboard image
qllm ask "Analyze this diagram" --use-clipboard
```

### Advanced Features

1. **Template Usage**
```bash
# Run template with variables
qllm run template.yaml -v '{"name": "John", "age": 30}'

# Extract specific variables
qllm run analysis.yaml -e "summary,key_points"
```

2. **Output Control**
```bash
# Save to file
qllm ask "Write a story about AI" -o story.txt

# Disable streaming for batch processing
qllm ask "Generate a report" --no-stream
```

3. **Provider Management**
```bash
# List available providers
qllm list providers

# View models for specific provider
qllm list models openai -f
```

### Configuration

1. **Setting Preferences**
```bash
# Set default provider
qllm configure --set provider=openai

# Set default model
qllm configure --set model=gpt-4
```

2. **Viewing Settings**
```bash
# View all settings
qllm configure --list

# Check specific setting
qllm configure --get model
```

### Using with Pipes

```bash
# Pipe text for analysis
cat document.txt | qllm ask "Summarize this text"

# Process command output
ls -l | qllm ask "Explain these file permissions"
```

## 9. Troubleshooting

### Common Issues

1. **Configuration Issues**
   - Check your configuration:
     ```bash
     qllm configure --list
     ```
   - Verify API keys are set correctly in environment variables
   - Ensure provider and model selections are valid

2. **Provider Errors**
   - Verify provider availability:
     ```bash
     qllm list providers
     ```
   - Check model compatibility:
     ```bash
     qllm list models <provider>
     ```
   - Ensure API key is valid for the selected provider

3. **Image Input Problems**
   - Verify supported formats: jpg, jpeg, png, gif, bmp, webp
   - Check file permissions and paths
   - For clipboard issues, ensure image is properly copied
   - For screenshots, verify display number is correct

4. **Network Issues**
   - Check internet connection
   - Verify no firewall blocking
   - Try with --no-stream option to rule out streaming issues

### Error Messages

Common error messages and solutions:

1. "Invalid provider"
   - Use `qllm list providers` to see available providers
   - Set valid provider: `qllm configure --set provider=<provider>`

2. "Invalid model"
   - Check available models: `qllm list models <provider>`
   - Set valid model: `qllm configure --set model=<model>`

3. "Configuration error"
   - Reset configuration: Remove ~/.qllmrc
   - Reconfigure: `qllm configure`

4. "API key not found"
   - Set required environment variables
   - Verify API key format and validity

### Updates and Installation

1. **Version Issues**
   - Check current version:
     ```bash
     qllm --version
     ```
   - Update to latest:
     ```bash
     npm update -g qllm
     ```

2. **Installation Problems**
   - Verify Node.js version (14+)
   - Try with sudo if permission errors:
     ```bash
     sudo npm install -g qllm
     ```
   - Clear npm cache if needed:
     ```bash
     npm cache clean --force
     ```

### Getting Help

If issues persist:
1. Check the [GitHub Issues](https://github.com/quantalogic/qllm/issues)
2. Use `qllm <command> --help` for command-specific help
3. Run with debug logging:
   ```bash
   qllm --log-level debug <command>
   ```

## 10. Contributing

We welcome contributions to QLLM CLI! Here's how you can help:

### Development Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/your-username/qllm.git
cd qllm
```

2. Install dependencies:
```bash
npm install
```

3. Create a feature branch:
```bash
git checkout -b feature/your-feature-name
```

### Development Guidelines

1. **Code Style**
   - Follow existing code style
   - Use TypeScript for type safety
   - Add JSDoc comments for public APIs
   - Keep functions focused and modular

2. **Testing**
   - Add tests for new features
   - Ensure existing tests pass:
     ```bash
     npm test
     ```
   - Include both unit and integration tests

3. **Documentation**
   - Update README.md for new features
   - Add JSDoc comments
   - Include examples in documentation
   - Keep documentation synchronized with code

### Submitting Changes

1. Commit your changes:
```bash
git add .
git commit -m "feat: description of your changes"
```

2. Push to your fork:
```bash
git push origin feature/your-feature-name
```

3. Create a Pull Request:
   - Provide clear description of changes
   - Reference any related issues
   - Include test results
   - List any breaking changes

### Code Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, changes will be merged
4. Your contribution will be acknowledged

## 11. License

QLLM CLI is licensed under the Apache License, Version 2.0.

```
Copyright 2023 Quantalogic

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

## 12. Acknowledgements

QLLM CLI is made possible thanks to:

- The open-source community
- Contributors and maintainers
- LLM providers and their APIs
- Node.js and npm ecosystem

Special thanks to all who have contributed to making this project better!
