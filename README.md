# 🚀 QLLM: Simplifying Language Model Interactions

Welcome to QLLM, a project designed to streamline your interactions with Large Language Models (LLMs). This monorepo contains two powerful packages:

1. 📚 **qllm-lib**: A versatile TypeScript library for seamless LLM integration.
2. 🖥️ **qllm-cli**: A command-line interface for effortless LLM interactions.

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

# Describe a picture
qllm ask --stream --model llava:latest --provider ollama "Describe the picture" -i "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Kowloon_Waterfront%2C_Hong_Kong%2C_2013-08-09%2C_DD_05.jpg/640px-Kowloon_Waterfront%2C_Hong_Kong%2C_2013-08-09%2C_DD_05.jpg"

# Chat
qllm chat --provider ollama --model gemma2:2b
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

Certainly! I'll rewrite the full updated documentation, incorporating the improvements while maintaining the original features and style. Here's the enhanced version:


### Quick Start

For experienced users who want to get up and running quickly:

```bash
git clone https://github.com/quantalogic/qllm.git
cd qllm
pnpm install
pnpm run build
pnpm run test
```

### Project Structure

This monorepo contains the following packages:

- `qllm-core`: Core functionality of the QLLM library
- `qllm-cli`: Command-line interface for QLLM
- (Add other packages as applicable)

Each package has its own `package.json`, source code, and tests.

### How to Use

This section provides comprehensive instructions on how to install, build, test, version, and publish the project.

#### Installation

To set up the project:

1. Ensure you have Node.js (≥16.5.0) and pnpm (≥6.0.0) installed.
2. Clone the repository:
   ```bash
   git clone https://github.com/quantalogic/qllm.git
   cd qllm
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```

#### Building

To build all packages in the monorepo:

```bash
pnpm run build
```

This command executes the build script for each package, compiling TypeScript and bundling with Rollup as configured.

#### Testing

Run tests across all packages:

```bash
pnpm run test
```

This executes test suites in each package, ensuring code quality and functionality.

#### Versioning and Changesets

This project uses Semantic Versioning (SemVer) and Changesets for version management.

##### Understanding Semantic Versioning

SemVer uses a three-part version number: MAJOR.MINOR.PATCH

- MAJOR: Incremented for incompatible API changes
- MINOR: Incremented for backwards-compatible new features
- PATCH: Incremented for backwards-compatible bug fixes

##### Creating a Changeset

1. Make code changes.
2. Run:
   ```bash
   pnpm changeset
   ```
3. Follow prompts to select modified packages and describe changes.

   Example:
   ```
   $ pnpm changeset
   🦋  Which packages would you like to include? · qllm-core, qllm-cli
   🦋  Which packages should have a major bump? · No items were selected
   🦋  Which packages should have a minor bump? · qllm-cli
   🦋  Which packages should have a patch bump? · qllm-core
   🦋  Please enter a summary for this change (this will be in the changelogs).
   🦋  Summary · Added new CLI command and fixed core module bug
   ```

4. Commit the generated changeset file with your changes.

##### Updating Versions

To apply changesets and update versions:

```bash
pnpm run version
```

This command:
1. Analyzes changesets
2. Updates `package.json` files
3. Updates changelogs (CHANGELOG.md)
4. Removes changeset files

Example output:
```
Applying changesets
qllm-core patch
qllm-cli minor
All changesets applied!
```

##### Versioning in Monorepo

- Each package has its own version
- Inter-package dependencies are automatically updated
- Root `package.json` version represents the overall project version

#### Publishing

To publish packages:

1. Ensure the project is built:
   ```bash
   pnpm run build
   ```
2. Run the publish command:
   ```bash
   pnpm run publish-packages
   ```

This publishes all packages to npm with public access.

### Additional Commands

- Linting: `pnpm run lint`
- Formatting: `pnpm run format`
- Cleaning build artifacts: `pnpm run clean`
- Installing CLI locally:
  ```bash
  pnpm run install:local
  ```
  This builds the project and installs `qllm-cli` globally from `packages/qllm-cli`.

### Best Practices

- Create a changeset for each significant change
- Use clear, concise descriptions in changesets
- Run `pnpm run version` before publishing
- Review changes in `package.json` and changelogs before committing

By following these practices, you ensure accurate version numbers and help users understand the impact of updates.

### Troubleshooting

Common issues and their solutions:

1. **Issue**: `pnpm install` fails
   **Solution**: Ensure you're using pnpm 6.0.0 or higher. Try clearing the pnpm cache with `pnpm store prune`.

2. **Issue**: Build fails with TypeScript errors
   **Solution**: Check that you're using a compatible TypeScript version (5.5.4 or compatible). Run `pnpm update typescript` to update.

3. **Issue**: Changesets not working
   **Solution**: Ensure @changesets/cli is installed correctly. Try reinstalling with `pnpm add -D @changesets/cli`.

### FAQ

Q: Can I use npm or yarn instead of pnpm?
A: While it's possible, we strongly recommend using pnpm for consistency and to avoid potential issues.

Q: How do I contribute to a specific package?
A: Navigate to the package directory in `packages/` and make your changes there. Ensure you create a changeset for your modifications.

### Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Create a changeset describing your changes
5. Submit a pull request

For more details, see our [CONTRIBUTING.md](CONTRIBUTING.md) file.


Remember to check the `scripts` section in `package.json` for any additional or updated commands.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for details.

## 🌟 Final Thoughts

QLLM and QLLM-LIB are designed to make working with Large Language Models more accessible and efficient. Whether you're a developer integrating AI capabilities into your applications or a data scientist streamlining your workflow, QLLM provides the tools you need to leverage the power of AI effectively.

We invite you to explore the detailed documentation for each package and join us in improving how businesses interact with AI. Together, we can create practical solutions that drive real-world impact.

Happy coding! 🚀
