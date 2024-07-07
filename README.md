# QLLM: Multi-Provider LLM Command CLI

QLLM (QuantaLogic LLM) is a powerful and flexible Command Line Interface (CLI) for interacting with multiple Large Language Model (LLM) providers. Built with ❤️ by [@quantalogic](https://github.com/quantalogic), QLLM simplifies the process of leveraging state-of-the-art language models in your projects and workflows.

⭐ If you find QLLM useful, consider giving us a star on GitHub! It helps us reach more developers and improve the tool. ⭐

## 🌟 Key Features

- 🔄 Multi-provider support (currently featuring AWS Bedrock Anthropic's Claude models, OpenAI and [Ollama](https://ollama.com/))
- 💬 Interactive chat mode for continuous conversations
- 🌊 Streaming responses for real-time output
- ⚙️ Configurable model parameters (temperature, top-p, top-k, etc.)
- 📁 File input/output support for batch processing
- 🎨 Customizable output formats (JSON, Markdown, plain text)
- 🛠️ Easy-to-use configuration management
- 📝 Template system for reusable prompts and workflows

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

5. Create and use a template:

```bash
qllm template create
qllm template execute my-template
```
## Configuration

QLLM uses a configuration file to manage various settings. The default configuration file is named `.qllmrc.yaml` and is located in the user's home directory.

### Global Configuration

You can view and modify the global configuration using the `config` command:

```bash
qllm config --show
qllm config --set-profile <profile>
qllm config --set-region <region>
qllm config --set-provider <provider>
qllm config --set-model <model>
qllm config --set-log-level <level>
qllm config --set-max-tokens <tokens>
qllm config --set-prompts-dir <directory>
```

#### Configuration File Format

The configuration file (`.qllmrc.yaml`) uses YAML format. Here's an example of its structure:

```yaml
awsProfile: default
awsRegion: us-east-1
defaultProvider: anthropic
defaultModel: haiku
logLevel: info
defaultMaxTokens: 2048
promptDirectory: ~/qllm/prompts
```

#### Configuration Resolution

QLLM resolves configuration in the following order of precedence:

1. Command-line arguments
2. Template-specific configuration (for template commands)
3. Global configuration from `.qllmrc.yaml`
4. Default values

This allows for flexible configuration management, from global defaults to template-specific overrides and per-command customization.

### Environment Variables

You can also use environment variables to set configuration options. The variable names should be prefixed with `QLLM_`. For example:

```bash
export QLLM_DEFAULT_PROVIDER=openai
export QLLM_DEFAULT_MODEL=gpt-3.5-turbo
```

Mapping Env variable configuration.

```plain
  'QLLM_AWS_PROFILE': 'awsProfile',
  'QLLM_AWS_REGION': 'awsRegion',
  'QLLM_DEFAULT_PROVIDER': 'defaultProvider',
  'QLLM_DEFAULT_MODEL': 'defaultModel',
  'QLLM_DEFAULT_MAX_TOKENS': 'defaultMaxTokens',
  'QLLM_PROMPT_DIRECTORY': 'promptDirectory',
  'QLLM_CONFIG_FILE': 'configFile',
  'QLLM_LOG_LEVEL': 'logLevel'
```

Environment variables take precedence over the configuration file but are overridden by command-line arguments.

## 📚 Detailed Documentation

### Command Structure

QLLM offers several main commands:

1. `ask`: Ask a single question and get a response
2. `chat`: Start an interactive chat session
3. `stream`: Stream a response in real-time
4. `config`: View or update configuration settings
5. `template`: Manage and execute prompt templates

#### Common Options

Each command supports various options to customize the behavior of the LLM:

- `--max-tokens <number>`: Maximum number of tokens to generate (default: 256)
- `--temperature <number>`: Controls randomness (0-1, default: 0.7)
- `--top-p <number>`: Nucleus sampling parameter (0-1, default: 1)
- `--top-k <number>`: Top-k sampling parameter (1-1000, default: 250)
- `--system <string>`: System message to set context
- `--file <path>`: Path to input file
- `--output <path>`: Path to output file
- `--format <format>`: Output format (json, markdown, text)
- `--provider <provider>`: LLM provider (anthropic, openai, ollama)
- `--model <model>`: Specific model to use

### Template Command

The `template` command allows you to create, manage, and execute reusable prompt templates. This feature is particularly useful for standardizing prompts across your team or for complex multi-step interactions with LLMs.

#### Subcommands

- `list`: List all available templates
- `create`: Create a new template
- `execute`: Execute a template
- `delete`: Delete a template
- `view`: View the contents of a template
- `edit`: Edit an existing template
- `variables`: Display all variables in a template

#### Creating a Template

To create a new template:

```bash
qllm template create
```

You will be prompted to enter details such as the template name, description, provider, model, and content. You can also define input and output variables.

#### Executing a Template

To execute a template:

```bash
qllm template execute template-name -v:variable1=value1 -v:variable2=value2
```

You can provide values for the template variables using the `-v:` prefix.

#### Template Structure

A template typically includes:

- Name and description
- Provider and model specifications
- Input variables with types and descriptions
- Output variables (optional)
- The main content with placeholders for variables

Example template structure:

```yaml
name: summarize-article
version: 1.0.0
description: Summarize a given article
author: QLLM Team
provider: anthropic
model: haiku
input_variables:
  article_text:
    type: string
    description: The text of the article to summarize
  summary_length:
    type: number
    description: The desired length of the summary in words
    default: 100
output_variables:
  summary:
    type: string
    description: The generated summary
content: |
  Please summarize the following article in approximately {{summary_length}} words:

  {{article_text}}

  Provide a concise and informative summary that captures the main points of the article.
```

#### File Inclusion in Templates

QLLM supports including external files in your templates, allowing for modular and reusable content. To include a file, use the following syntax in your template content:

```
{{file: path/to/file.txt}}
```

The file path is relative to the template directory. This feature is useful for:

- Sharing common prompts across multiple templates
- Including large datasets or context information
- Organizing complex templates into smaller, manageable files

Example template with file inclusion:

```yaml
name: code-review
version: 1.0.0
description: Perform a code review
author: QLLM Team
provider: anthropic
model: opus
input_variables:
  code:
    type: string
    description: The code to review
output_variables:
  review:
    type: string
    description: The code review comments
content: |
  {{file: prompts/code_review_instructions.txt}}

  Here's the code to review:

  
  {{code}}
  

  Please provide a detailed code review based on the instructions above.
```

In this example, `code_review_instructions.txt` might contain general guidelines for code review, which can be reused across multiple templates.

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

### Using Templates for Consistent Prompts

Create a template for generating product descriptions:

```bash
qllm template create
# Follow the prompts to create a template named "product-description"
```

Execute the template:

```bash
qllm template execute product-description -v:product_name="Eco-friendly Water Bottle" -v:key_features="Insulated, BPA-free, 24oz capacity"
```

### Multi-step Analysis with Templates

Create a template for analyzing financial data:

```yaml
name: financial-analysis
description: Perform a multi-step financial analysis
provider: anthropic
model: opus
input_variables:
  company_name:
    type: string
    description: Name of the company to analyze
  financial_data:
    type: string
    description: Key financial metrics of the company
output_variables:
  summary:
    type: string
    description: Summary of the financial analysis
  recommendations:
    type: array
    description: List of recommendations based on the analysis
content: |
  Perform a comprehensive financial analysis for {{company_name}} based on the following data:

  {{financial_data}}

  1. Summarize the company's financial health.
  2. Identify key strengths and weaknesses.
  3. Provide at least three actionable recommendations.

  Format your response as follows:

  <summary>
  [Your summary here]
  </summary>

  <recommendations>
  - [Recommendation 1]
  - [Recommendation 2]
  - [Recommendation 3]
  </recommendations>
```

Execute the financial analysis template:

```bash
qllm template execute financial-analysis -v:company_name="TechCorp Inc." -v:financial_data="Revenue: $100M, Profit Margin: 15%, Debt-to-Equity: 0.5" --output analysis_result.json
```

This example demonstrates how templates can be used for complex, multi-step analyses with structured output.

## 🗂 Project Structure

```
qllm/
├── src/
│   ├── commands/         # Implementation of CLI commands
│   ├── config/           # Configuration management
│   ├── helpers/          # Utility functions
│   ├── providers/        # LLM provider integrations
│   ├── templates/        # Template management and execution
│   ├── utils/            # General utility functions
│   └── qllm.ts           # Main entry point
├── .env                  # Environment variables
├── package.json          # Project dependencies and scripts
└── README.md             # Project documentation
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
- **Template Errors**: Check that all required variables are provided when executing a template.

For more issues, please check our GitHub Issues page or submit a new issue.

## ❓ Frequently Asked Questions

1. **Q: How do I update QLLM?**
   A: Run `npm update -g qllm` to update to the latest version.

2. **Q: Can I use QLLM in my scripts?**
   A: Yes, QLLM can be easily integrated into shell scripts or other automation tools.

3. **Q: Is my data secure when using QLLM?**
   A: QLLM does not store any of your prompts or responses. However, please review the privacy policies of the LLM providers you're using.

4. **Q: How can I create complex workflows with templates?**
   A: You can create multiple templates and chain them together using shell scripts or by referencing the output of one template as input to another.

## 🗺 Roadmap

- [ ] Add a command the list the available providers
  [ ] Add a list that present the models available for a provider
- [ ] Cost evaluation by providers
- [ ] Add support for more LLM providers
- [ ] Implement AI agent capabilities
- [ ] Expand provider support to include more LLM services
- [ ] Add safe code interpreter
- [ ] Add tool support
- [ ] Multi-Modal Input and Output
- [ ] Prompt libraries and sharing
- [ ] Custom Workflows and Pipelines, Enable users to chain multiple LLM calls into a single workflow
- [ ] API Integration
- [ ] Advanced Analytics and Monitoring
- [ ] Semantic Search and Knowledge Base
- [ ] Plugin Ecosystem
- [ ] AI-Assisted Prompt Engineering
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
