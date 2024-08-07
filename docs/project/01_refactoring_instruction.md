# Analysis of Multi-Provider LLM CLI and Core Library Separation

## 1. Detailed Analysis

### Current Structure
The project has been separated into two main packages:
1. `qllm-cli`: Handles CLI commands and user interactions
2. `qllm-core`: Contains core functionality and provider implementations

### Strengths
- Clear separation of concerns between CLI and core functionality
- Core library can be used independently in other projects
- CLI package focuses on user interaction and command handling

### Areas for Improvement
1. **Dependency Management**: The CLI package directly references the core package using a file path, which may cause issues in different environments.
2. **Package Naming**: The core package name `@qllm/core` might conflict with npm scoped packages.
3. **File Naming Convention**: Inconsistent use of camelCase and kebab-case in file names.
4. **Type Definitions**: Some type definitions are duplicated across packages.
5. **Configuration Management**: Configuration handling is spread across multiple files and could be centralized.
6. **Error Handling**: Error management could be more consistent and centralized.
7. **Testing**: Limited test coverage, especially for the core library.
8. **Documentation**: Lack of comprehensive documentation for both packages.

### Potential Challenges
- Ensuring backward compatibility when refactoring
- Maintaining consistency across both packages
- Properly exporting and importing types between packages
- Handling cross-package dependencies efficiently

## 2. Possible Approaches

### Approach 1: Refined Monorepo Structure
- Keep the current monorepo structure but improve package management
- Use Lerna or Yarn Workspaces for better monorepo management
- Standardize naming conventions and file structure
- Centralize shared configurations and types

### Approach 2: Complete Separation
- Fully separate the CLI and core packages into independent repositories
- Publish the core package to npm for easier consumption by the CLI and other projects
- Implement a more robust versioning and release strategy for both packages

### Approach 3: Hybrid Approach
- Maintain the monorepo structure for development
- Set up automated processes to publish the core package independently
- Improve isolation between packages while keeping development convenience

## 3. Evaluation of Approaches

### Approach 1: Refined Monorepo Structure
Pros:
- Easier to maintain consistency across packages
- Simplified development workflow
- Shared configuration and tooling

Cons:
- May still have tight coupling between packages
- Potential for unintended breaking changes affecting both packages

### Approach 2: Complete Separation
Pros:
- Clear separation of concerns
- Independent versioning and release cycles
- Easier to maintain backward compatibility

Cons:
- More complex development setup
- Potential duplication of configuration and tooling
- Harder to make cross-package changes

### Approach 3: Hybrid Approach
Pros:
- Balances development convenience with package independence
- Allows for independent publishing of the core package
- Maintains monorepo benefits for development

Cons:
- Requires more complex setup and automation
- May introduce versioning challenges

Recommendation: Proceed with Approach 3 (Hybrid Approach) as it offers the best balance between development convenience and package independence.

## 4. Detailed Implementation Plan

1. Refactor Package Structure
   - Rename `qllm-core` to `qllm-lib` to avoid npm scope conflicts
   - Update all import statements in `qllm-cli` to use the new package name

2. Implement Yarn Workspaces
   - Set up Yarn Workspaces in the root `package.json`
   - Update `package.json` files in both packages to use workspace references

3. Standardize File Naming and Code Style
   - Implement consistent snake_case for file names
   - Ensure camelCase is used for variables and function names
   - Set up ESLint and Prettier configurations in the root directory

4. Centralize Shared Types and Configurations
   - Create a new `qllm-types` package for shared type definitions
   - Move common configurations to the root directory

5. Improve Error Handling
   - Implement a centralized error handling mechanism in `qllm-lib`
   - Ensure consistent error usage across both packages

6. Enhance Testing
   - Set up Jest for both packages
   - Implement unit tests for core functionality in `qllm-lib`
   - Add integration tests for CLI commands in `qllm-cli`

7. Implement Documentation
   - Set up TypeDoc for API documentation
   - Create README files for each package and the root directory
   - Document usage examples and configuration options

8. Set Up Automated Publishing
   - Implement semantic-release for versioning
   - Set up GitHub Actions for automated testing and publishing

9. Refactor CLI to Use Published Core Package
   - Update `qllm-cli` to use the published version of `qllm-lib`
   - Implement version management for `qllm-lib` dependency

## 5. Bash Script for Project Separation

```bash
#!/bin/bash

# Create new directory structure
mkdir -p qllm-monorepo/packages/qllm-cli
mkdir -p qllm-monorepo/packages/qllm-lib
mkdir -p qllm-monorepo/packages/qllm-types

# Move CLI files
mv packages/qllm-cli/* qllm-monorepo/packages/qllm-cli/

# Move core library files
mv packages/qllm-core/* qllm-monorepo/packages/qllm-lib/

# Create qllm-types package
echo '{
  "name": "@qllm/types",
  "version": "1.0.0",
  "description": "Shared types for QLLM",
  "main": "index.js",
  "types": "index.d.ts",
  "private": true
}' > qllm-monorepo/packages/qllm-types/package.json

# Update root package.json
echo '{
  "name": "qllm-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "yarn workspaces run build",
    "test": "yarn workspaces run test",
    "lint": "yarn workspaces run lint"
  }
}' > qllm-monorepo/package.json

# Move to new monorepo directory
cd qllm-monorepo

# Initialize git repository
git init

# Create .gitignore
echo 'node_modules
dist
.env
*.log' > .gitignore

# Install dependencies
yarn install

echo "Project structure has been updated. Please review the changes and adjust as needed."
```

## 6. Detailed Explanation of Changes to Codebase

1. Package Renaming and Structure:
   - Rename `qllm-core` to `qllm-lib` in all files and import statements
   - Update `package.json` files to reflect new package names and dependencies

2. Type Definitions:
   - Create new files in `qllm-types` for shared type definitions
   - Update import statements in both `qllm-cli` and `qllm-lib` to use `@qllm/types`

3. Configuration Management:
   - Move configuration-related files to a `config` directory in `qllm-lib`
   - Implement a centralized configuration manager in `qllm-lib`

4. Error Handling:
   - Create an `errors` directory in `qllm-lib` for custom error classes
   - Implement a centralized error handler in `qllm-lib`
   - Update all error throwing and handling to use the new error system

5. File Naming Convention:
   - Rename all files to use snake_case
   - Update import statements to reflect new file names

6. Code Style:
   - Ensure all variables and function names use camelCase
   - Implement consistent code formatting using Prettier

7. Testing:
   - Create `__tests__` directories in both packages
   - Implement unit tests for core functionality in `qllm-lib`
   - Add integration tests for CLI commands in `qllm-cli`

8. Documentation:
   - Add JSDoc comments to all public functions and classes
   - Create README.md files for each package with usage instructions
   - Set up TypeDoc for generating API documentation

9. Build and Publish Configuration:
   - Update `tsconfig.json` files for both packages
   - Implement semantic-release configuration
   - Create GitHub Actions workflows for testing and publishing

These changes will result in a more maintainable, well-documented, and efficiently structured project that adheres to best practices for TypeScript development and package management.

---
Certainly! I'll provide a more detailed explanation of the Type Definitions changes, including the creation of new files in `qllm-types` for shared type definitions and updating import statements in both `qllm-cli` and `qllm-lib` to use `@qllm/types`.

1. Creating new files in qllm-types for shared type definitions:

First, we'll create a new package called `qllm-types` to house all shared type definitions. This package will be structured as follows:

```
packages/
  qllm-types/
    package.json
    tsconfig.json
    src/
      index.ts
      config/
        types.ts
      providers/
        types.ts
      templates/
        types.ts
```

a. Create `packages/qllm-types/package.json`:

```json
{
  "name": "@qllm/types",
  "version": "1.0.0",
  "description": "Shared type definitions for QLLM",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^4.5.0"
  }
}
```

b. Create `packages/qllm-types/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "CommonJS",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}
```

c. Create type definition files:

In `packages/qllm-types/src/config/types.ts`:

```typescript
export interface AppConfig {
  awsProfile: string;
  awsRegion: string;
  defaultProvider: ProviderName;
  defaultModelId?: string;
  promptDirectory: string;
  logLevel: string;
  defaultMaxTokens: number;
  defaultModelAlias: string;
}

export type ProviderName = 'anthropic' | 'openai' | 'ollama' | 'groq' | 'perplexity' | 'mistral';
```

In `packages/qllm-types/src/providers/types.ts`:

```typescript
export interface LLMProviderOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  system?: string;
  model: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

In `packages/qllm-types/src/templates/types.ts`:

```typescript
import { LLMProviderOptions } from '../providers/types';
import { ProviderName } from '../config/types';

export interface TemplateDefinition {
  name: string;
  version: string;
  description: string;
  author: string;
  provider: ProviderName;
  model: string;
  input_variables: Record<string, TemplateVariable>;
  output_variables?: Record<string, OutputVariable>;
  content: string;
  parameters?: {
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
  resolved_content?: string;
}

export interface TemplateVariable {
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  default?: any;
}

export interface OutputVariable {
  type: 'string' | 'integer' | 'float' | 'boolean' | 'array' | 'object';
  description?: string;
  default?: any;
}
```

d. Create `packages/qllm-types/src/index.ts` to export all types:

```typescript
export * from './config/types';
export * from './providers/types';
export * from './templates/types';
```

2. Updating import statements in qllm-cli and qllm-lib:

Now that we have created the shared type definitions in `@qllm/types`, we need to update the import statements in both `qllm-cli` and `qllm-lib` to use these shared types.

a. Update `packages/qllm-cli/package.json`:

Add `@qllm/types` as a dependency:

```json
{
  "dependencies": {
    "@qllm/types": "^1.0.0",
    // ... other dependencies
  }
}
```

b. Update `packages/qllm-lib/package.json`:

Add `@qllm/types` as a dependency:

```json
{
  "dependencies": {
    "@qllm/types": "^1.0.0",
    // ... other dependencies
  }
}
```

c. Update import statements in qllm-cli:

For example, in `packages/qllm-cli/src/cli/commands/ask.ts`:

```typescript
import { LLMProviderOptions, Message } from '@qllm/types';
```

d. Update import statements in qllm-lib:

For example, in `packages/qllm-lib/src/core/providers/llm_provider.ts`:

```typescript
import { LLMProviderOptions, Message } from '@qllm/types';
```

3. Benefits of this approach:

- Centralized type definitions: All shared types are now in one place, making it easier to maintain and update.
- Consistency: Both `qllm-cli` and `qllm-lib` use the same type definitions, ensuring consistency across the project.
- Better IDE support: With proper type definitions, IDEs can provide better autocomplete and type checking.
- Easier refactoring: When types need to be changed, you only need to update them in one place.

4. Additional steps:

- Update the build process to include building the `qllm-types` package before building `qllm-cli` and `qllm-lib`.
- Ensure that the `tsconfig.json` files in `qllm-cli` and `qllm-lib` are configured to recognize the `@qllm/types` package.

By implementing these changes, you'll have a more organized and maintainable type system across your QLLM project, with shared types centralized in the `@qllm/types` package.

---

Certainly! I'll provide a detailed explanation of how to implement centralized configuration management in the `qllm-lib` package. This will involve moving configuration-related files to a dedicated `config` directory and implementing a centralized configuration manager.

1. Create a new `config` directory in `qllm-lib`:

```bash
mkdir -p packages/qllm-core/src/config
```

2. Move existing configuration files:

Move the following files to the new `config` directory:

- `packages/qllm-core/src/core/config/default_config.ts`
- `packages/qllm-core/src/core/config/types.ts`
- `packages/qllm-core/src/core/config/provider_config.ts`
- `packages/qllm-core/src/core/config/model_aliases.ts`

3. Update import statements:

Update all import statements in the project to reflect the new file locations. For example:

```typescript
import { AppConfig } from '../../config/types';
import { DEFAULT_APP_CONFIG } from '../../config/default_config';
```

4. Implement a centralized configuration manager:

Create a new file `packages/qllm-core/src/config/configuration_manager.ts`:

```typescript
import { EventEmitter } from 'events';
import { AppConfig } from './types';
import { DEFAULT_APP_CONFIG } from './default_config';
import { logger } from '../common/utils/logger';
import { ErrorManager } from '../common/utils/error_manager';
import { ConfigurationFileLoader } from '../common/utils/configuration_file_loader';

export class ConfigurationManager extends EventEmitter {
  private static instance: ConfigurationManager;
  private config: AppConfig;
  private configLoader: ConfigurationFileLoader;

  private constructor() {
    super();
    this.config = { ...DEFAULT_APP_CONFIG };
    this.configLoader = new ConfigurationFileLoader('');
  }

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  public async loadConfig(configPath?: string): Promise<void> {
    try {
      logger.debug('Loading configuration...');
      this.configLoader = new ConfigurationFileLoader(configPath || '');
      const loadedConfig = await this.configLoader.loadConfig();
      this.updateConfig(loadedConfig);
      logger.debug(`Configuration loaded: ${JSON.stringify(this.config)}`);
    } catch (error) {
      ErrorManager.handleError('ConfigLoadError', `Failed to load configuration: ${error}`);
    }
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public async updateAndSaveConfig(updates: Partial<AppConfig>): Promise<void> {
    this.updateConfig(updates);
    await this.saveConfig();
  }

  public updateConfig(updates: Partial<AppConfig>): void {
    const oldConfig = { ...this.config };
    this.config = {
      ...this.config,
      ...Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      ),
    };
    logger.debug(`Configuration updated. Old: ${JSON.stringify(oldConfig)}, New: ${JSON.stringify(this.config)}`);
    this.emit('configUpdated', this.config);
  }

  private async saveConfig(): Promise<void> {
    try {
      await this.configLoader.saveConfig(this.config);
      logger.debug('Configuration saved successfully');
    } catch (error) {
      ErrorManager.handleError('ConfigSaveError', `Failed to save configuration: ${error}`);
    }
  }

  public validateConfig(): boolean {
    // Add validation logic here if needed
    return true;
  }
}

export const configManager = ConfigurationManager.getInstance();
```

5. Update `configuration_file_loader.ts`:

Update `packages/qllm-core/src/common/utils/configuration_file_loader.ts` to work with the new configuration structure:

```typescript
import yaml from 'js-yaml';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';
import { ErrorManager } from './error_manager';
import { AppConfig } from '../../config/types';
import { DEFAULT_APP_CONFIG } from '../../config/default_config';

export class ConfigurationFileLoader {
  private configFilePath: string;

  constructor(configFilePath: string) {
    this.configFilePath = configFilePath || this.getDefaultConfigPath();
  }

  private getDefaultConfigPath(): string {
    return path.join(process.env.HOME || process.env.USERPROFILE || '', '.qllmrc.yaml');
  }

  async loadConfig(): Promise<AppConfig> {
    try {
      const configContent = await fs.readFile(this.configFilePath, 'utf-8');
      const loadedConfig = yaml.load(configContent) as Partial<AppConfig>;
      return { ...DEFAULT_APP_CONFIG, ...loadedConfig };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.warn(`Configuration file not found at ${this.configFilePath}. Using default configuration.`);
        return DEFAULT_APP_CONFIG;
      }
      ErrorManager.throwError('ConfigLoadError', `Failed to load configuration: ${error}`);
    }
  }

  async saveConfig(config: AppConfig): Promise<void> {
    try {
      const configContent = yaml.dump(config);
      await fs.writeFile(this.configFilePath, configContent, 'utf-8');
      logger.debug(`Configuration saved to ${this.configFilePath}`);
    } catch (error) {
      ErrorManager.throwError('ConfigSaveError', `Failed to save configuration: ${error}`);
    }
  }
}
```

6. Update the main entry point:

Update `packages/qllm-core/src/index.ts` to export the configuration manager:

```typescript
export * from './config/configuration_manager';
export * from './config/types';
export * from './config/provider_config';
export * from './config/model_aliases';
// ... other exports
```

7. Update usage in the CLI package:

Update `packages/qllm-cli/src/cli/qllm.ts` to use the new configuration manager:

```typescript
import { Command } from "commander";
import { configManager } from "@qllm/core";
// ... other imports

export async function main() {
  try {
    const program = new Command();
    // ... existing program setup

    program.hook('preAction', async (thisCommand) => {
      try {
        const options = thisCommand.opts();
        await configManager.loadConfig(options.config);
        const config = configManager.getConfig();
        // ... rest of the preAction hook
      } catch (error) {
        // ... error handling
      }
    });

    // ... rest of the main function
  } catch (error) {
    // ... error handling
  }
}
```

8. Update the config command:

Update `packages/qllm-cli/src/cli/commands/config.ts` to use the new configuration manager:

```typescript
import { Command, Option } from 'commander';
import { configManager, AppConfig } from '@qllm/core';
// ... other imports

export function createConfigCommand(): Command {
  const configCommand = new Command('config')
    // ... existing command setup

    .action(async (options) => {
      try {
        if (options.show) {
          showConfig(configManager.getConfig());
        } else if (options.interactive) {
          await interactiveConfig();
        } else {
          await updateConfig(options);
        }
      } catch (error) {
        ErrorManager.handleError('ConfigCommandError', `Configuration error: ${error}`);
      }
    });

  return configCommand;
}

async function updateConfig(options: any): Promise<void> {
  const updates: Partial<AppConfig> = {};
  // ... populate updates object

  if (Object.keys(updates).length > 0) {
    await configManager.updateAndSaveConfig(updates);
    logger.info('Configuration updated successfully.');
    showConfig(configManager.getConfig());
  } else {
    logger.info('No configuration changes made.');
    showConfig(configManager.getConfig());
  }
}

// ... other helper functions
```

This implementation centralizes configuration management in the `qllm-lib` package, making it easier to maintain and update configuration across the entire project. The `ConfigurationManager` class provides a single point of access for reading and updating configuration, while the `ConfigurationFileLoader` handles the actual reading and writing of configuration files.

The configuration is now stored in a dedicated `config` directory, improving organization and making it easier to locate and manage configuration-related files. The use of a singleton pattern for the `ConfigurationManager` ensures that there's only one instance of the configuration throughout the application, preventing inconsistencies.

This approach also allows for easy extension of configuration management features, such as adding support for environment variables or remote configuration sources in the future.

---
Certainly! I'll provide a detailed explanation of how to implement a centralized error handling system in the `qllm-lib` package. This will involve creating custom error classes, implementing a centralized error handler, and updating the existing code to use the new error system.

1. Create an errors directory in qllm-lib for custom error classes:

First, let's create a new directory for our custom error classes:

```bash
mkdir -p packages/qllm-core/src/common/errors
```

Now, let's create a file for our custom error classes:

```typescript
// packages/qllm-core/src/common/errors/custom_errors.ts

export class QllmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QllmError';
  }
}

export class ConfigurationError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ProviderError extends QllmError {
  constructor(message: string, public providerName: string) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class TemplateError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateError';
  }
}

export class InputValidationError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'InputValidationError';
  }
}

export class OutputValidationError extends QllmError {
  constructor(message: string) {
    super(message);
    this.name = 'OutputValidationError';
  }
}
```

2. Implement a centralized error handler in qllm-lib:

Now, let's create a centralized error handler:

```typescript
// packages/qllm-core/src/common/utils/error_handler.ts

import { logger } from './logger';
import { QllmError } from '../errors/custom_errors';

export class ErrorHandler {
  static handle(error: unknown): void {
    if (error instanceof QllmError) {
      logger.error(`${error.name}: ${error.message}`);
    } else if (error instanceof Error) {
      logger.error(`Unexpected error: ${error.message}`);
      logger.debug(`Stack trace:\n${error.stack}`);
    } else {
      logger.error(`An unknown error occurred: ${error}`);
    }
  }

  static throw(ErrorClass: new (message: string) => QllmError, message: string): never {
    const error = new ErrorClass(message);
    this.handle(error);
    throw error;
  }
}
```

3. Update all error throwing and handling to use the new error system:

Now, we need to update our existing code to use the new error system. Here are some examples of how to update different parts of the codebase:

a. Update the configuration manager:

```typescript
// packages/qllm-core/src/common/utils/configuration_manager.ts

import { ErrorHandler } from './error_handler';
import { ConfigurationError } from '../errors/custom_errors';

// ...

public async loadConfig(options?: Partial<AppConfig>): Promise<void> {
  try {
    // ... existing code ...
  } catch (error) {
    ErrorHandler.throw(ConfigurationError, `Failed to load configuration: ${error}`);
  }
}

// ...
```

b. Update the provider factory:

```typescript
// packages/qllm-core/src/core/providers/provider_factory.ts

import { ErrorHandler } from '../../common/utils/error_handler';
import { ProviderError } from '../../common/errors/custom_errors';

// ...

static async getProvider(providerName: ProviderName): Promise<LLMProvider> {
  // ... existing code ...

  try {
    const provider = providerRegistry.getProvider(providerName, options);
    logger.debug(`Created provider instance: ${providerName}`);
    return provider;
  } catch (error) {
    ErrorHandler.throw(ProviderError, `Failed to create provider: ${error}`);
  }
}

// ...
```

c. Update the template manager:

```typescript
// packages/qllm-core/src/core/templates/template_manager.ts

import { ErrorHandler } from '../../common/utils/error_handler';
import { TemplateError, InputValidationError } from '../../common/errors/custom_errors';

// ...

async getTemplate(name: string): Promise<TemplateDefinition | null> {
  // ... existing code ...

  try {
    const content = await fs.readFile(filePath, "utf-8");
    const template = yaml.load(content) as TemplateDefinition;
    if (!template || typeof template !== "object") {
      ErrorHandler.throw(TemplateError, `Invalid template structure for ${name}`);
    }
    // ... rest of the method ...
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.error(`Failed to read template ${name}: ${error}`);
    }
    return null;
  }
}

// ...

private castVariable(
  key: string,
  value: string,
  inputVariables: Record<string, TemplateVariable>
): any {
  // ... existing code ...

  switch (variableType) {
    case "number":
      const numberValue = Number(value);
      if (isNaN(numberValue)) {
        ErrorHandler.throw(InputValidationError, `Failed to cast '${value}' to number for variable '${key}'`);
      }
      return numberValue;
    // ... other cases ...
  }

  // ... rest of the method ...
}

// ...
```

d. Update the CLI commands:

```typescript
// packages/qllm-cli/src/cli/commands/ask.ts

import { ErrorHandler } from '@qllm-core/common/utils/error_handler';
import { QllmError } from '@qllm-core/common/errors/custom_errors';

// ...

.action(async (options, command) => {
  try {
    // ... existing code ...
  } catch (error) {
    if (error instanceof QllmError) {
      ErrorHandler.handle(error);
    } else {
      ErrorHandler.handle(new QllmError(`Unexpected error in ask command: ${error}`));
    }
    process.exit(1);
  }
});

// ...
```

Repeat this process for other CLI commands and any other parts of the codebase where errors are thrown or caught.

4. Update the main entry point:

Finally, let's update the main entry point to use our new error handling system:

```typescript
// packages/qllm-cli/src/cli.ts

import { ErrorHandler } from '@qllm-core/common/utils/error_handler';
import { QllmError } from '@qllm-core/common/errors/custom_errors';

// ...

export async function main() {
  try {
    // ... existing code ...
  } catch (error) {
    if (error instanceof QllmError) {
      ErrorHandler.handle(error);
    } else {
      ErrorHandler.handle(new QllmError(`Unexpected error in main: ${error}`));
    }
    process.exit(1);
  }
}

// ...
```

By implementing this centralized error handling system, we achieve several benefits:

1. Consistent error handling across the entire application.
2. Better error categorization and logging.
3. Easier debugging and troubleshooting.
4. Improved error messages for end-users.

Remember to import and use the new error classes and error handler throughout the codebase, replacing existing error throwing and handling mechanisms. This will ensure that all errors are properly caught, logged, and handled in a consistent manner across the entire application.

---

Certainly! I'll provide a detailed explanation of how to implement the File Naming Convention changes, including renaming all files to use snake_case and updating import statements to reflect the new file names.

# File Naming Convention Update

## 1. Detailed Analysis

The current project structure uses a mix of camelCase and kebab-case for file naming. To improve consistency and adhere to the specified requirements, we'll rename all files to use snake_case. This change will affect both the `qllm-cli` and `qllm-core` packages.

### Current Issues:
- Inconsistent file naming conventions
- Mix of camelCase and kebab-case
- Potential confusion when referencing files

### Benefits of snake_case:
- Improved readability
- Consistency across the project
- Easier file name parsing and manipulation

## 2. Implementation Plan

1. Rename all files to snake_case
2. Update import statements in all files
3. Update references in package.json and tsconfig.json files
4. Verify and test the changes

## 3. Detailed Implementation

### Step 1: Rename Files

We'll use a bash script to rename all files to snake_case. Here's the script:

```bash
#!/bin/bash

function rename_to_snake_case() {
    find . -type f \( -name "*.ts" -o -name "*.js" \) | while read file; do
        directory=$(dirname "$file")
        filename=$(basename "$file")
        extension="${filename##*.}"
        filename="${filename%.*}"
        
        # Convert to snake_case
        new_filename=$(echo "$filename" | sed -r 's/([a-z0-9])([A-Z])/\1_\L\2/g; s/-/_/g' | tr '[:upper:]' '[:lower:]')
        
        if [ "$filename" != "$new_filename" ]; then
            mv "$file" "$directory/${new_filename}.${extension}"
            echo "Renamed: $file -> $directory/${new_filename}.${extension}"
        fi
    done
}

cd packages/qllm-cli
rename_to_snake_case

cd ../qllm-core
rename_to_snake_case
```

Save this script as `rename_to_snake_case.sh` in the root of your project and run it:

```bash
chmod +x rename_to_snake_case.sh
./rename_to_snake_case.sh
```

### Step 2: Update Import Statements

After renaming the files, we need to update all import statements to reflect the new file names. We'll use a combination of `find` and `sed` commands to achieve this:

```bash
#!/bin/bash

function update_imports() {
    find . -type f \( -name "*.ts" -o -name "*.js" \) | while read file; do
        # Convert camelCase to snake_case in import statements
        sed -i 's/from "\(.*\/\)\([a-zA-Z]*\)\([A-Z][a-zA-Z]*\)/from "\1\2_\L\3/g' "$file"
        sed -i 's/from "\.\([a-zA-Z]*\)\([A-Z][a-zA-Z]*\)/from ".\1_\L\2/g' "$file"
        
        # Convert kebab-case to snake_case in import statements
        sed -i 's/from "\(.*\/\)\([a-z-]*\)/from "\1\L\2/g; s/-/_/g' "$file"
        
        echo "Updated imports in: $file"
    done
}

cd packages/qllm-cli
update_imports

cd ../qllm-core
update_imports
```

Save this script as `update_imports.sh` in the root of your project and run it:

```bash
chmod +x update_imports.sh
./update_imports.sh
```

### Step 3: Update package.json and tsconfig.json

We need to update the `main`, `types`, and `bin` fields in `package.json` files, as well as the `include` and `exclude` patterns in `tsconfig.json` files to reflect the new file names.

For `packages/qllm-cli/package.json`:

```json
{
  "main": "dist/src/cli.js",
  "bin": {
    "qllm": "dist/cli.js"
  }
}
```

For `packages/qllm-core/package.json`:

```json
{
  "types": "dist/src/index.d.ts",
  "module": "dist/src/index.js"
}
```

For both `packages/qllm-cli/tsconfig.json` and `packages/qllm-core/tsconfig.json`:

```json
{
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

### Step 4: Verify and Test

After making these changes, it's crucial to verify that everything still works correctly:

1. Rebuild both packages:
   ```
   cd packages/qllm-cli && npm run build
   cd ../qllm-core && npm run build
   ```

2. Run the test suites:
   ```
   cd packages/qllm-cli && npm test
   cd ../qllm-core && npm test
   ```

3. Manually test the CLI to ensure all commands still work as expected.

## 4. Example of Changes

Here are some examples of how file names and import statements will change:

### File Renaming Examples:

- `errorHandler.ts` → `error_handler.ts`
- `configManager.ts` → `config_manager.ts`
- `templateExecutor.ts` → `template_executor.ts`

### Import Statement Updates:

Before:
```typescript
import { ErrorHandler } from './errorHandler';
import { ConfigManager } from './configManager';
import { TemplateExecutor } from './templateExecutor';
```

After:
```typescript
import { ErrorHandler } from './error_handler';
import { ConfigManager } from './config_manager';
import { TemplateExecutor } from './template_executor';
```

## 5. Potential Challenges and Solutions

1. **Git History**: Renaming files may make it harder to track changes in Git. Solution: Use `git mv` instead of regular `mv` when renaming files to preserve history.

2. **External Dependencies**: If any external scripts or tools rely on specific file names, they may break. Solution: Update any external references to the new file names.

3. **Documentation**: Existing documentation may reference old file names. Solution: Update all documentation to reflect the new naming convention.

4. **IDE and Editor Configuration**: Some IDE-specific settings may need to be updated. Solution: Review and update any IDE or editor configuration files.

## 6. Conclusion

Implementing this file naming convention will improve the overall consistency and readability of the project. It's important to thoroughly test all functionality after making these changes to ensure nothing has been broken in the process. If any issues arise, they should be addressed immediately before considering the migration complete.

Remember to commit these changes in a separate pull request, as it will involve a large number of file changes and may require careful review.


----

# Code Style Implementation

## 1. Detailed Analysis

Implementing a consistent code style across the project is crucial for maintainability, readability, and collaboration. The two main aspects we'll focus on are:

1. Using camelCase for all variables and function names
2. Implementing consistent code formatting using Prettier

### Current Issues:
- Inconsistent naming conventions across files
- Potential mix of different code formatting styles
- Lack of automated code style enforcement

### Benefits of Consistent Code Style:
- Improved code readability
- Easier maintenance and refactoring
- Reduced cognitive load for developers
- Fewer conflicts and easier code reviews

## 2. Implementation Plan

1. Update naming conventions to camelCase
2. Set up Prettier for code formatting
3. Configure ESLint to work with Prettier
4. Update npm scripts for linting and formatting
5. Create a pre-commit hook for automatic formatting
6. Update CI/CD pipeline to check code style

## 3. Detailed Implementation

### Step 1: Update Naming Conventions to camelCase

First, we need to update all variable and function names to use camelCase. This can be done manually or with the help of a script. Here's a simple script to help identify non-camelCase names:

```typescript
import * as fs from 'fs';
import * as path from 'path';

function findNonCamelCaseNames(dir: string): void {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      findNonCamelCaseNames(filePath);
    } else if (stats.isFile() && file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const match = line.match(/\b([a-z]+[A-Z][a-z]*|[A-Z]+[a-z]*)\b/g);
        if (match) {
          console.log(`File: ${filePath}`);
          console.log(`Line ${index + 1}: ${line.trim()}`);
          console.log(`Non-camelCase names: ${match.join(', ')}\n`);
        }
      });
    }
  }
}

findNonCamelCaseNames('./src');
```

Run this script and manually update the identified names to camelCase.

### Step 2: Set up Prettier for Code Formatting

1. Install Prettier as a dev dependency:

```bash
npm install --save-dev prettier
```

2. Create a Prettier configuration file `.prettierrc` in the root of the project:

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

3. Create a `.prettierignore` file to exclude certain files and directories:

```
node_modules
dist
build
coverage
```

### Step 3: Configure ESLint to Work with Prettier

1. Install ESLint and the Prettier plugin:

```bash
npm install --save-dev eslint eslint-config-prettier eslint-plugin-prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

2. Create an ESLint configuration file `.eslintrc.js` in the root of the project:

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // Add any custom rules here
  },
};
```

### Step 4: Update npm Scripts for Linting and Formatting

Add the following scripts to your `package.json`:

```json
{
  "scripts": {
    "lint": "eslint 'src/**/*.ts'",
    "lint:fix": "eslint 'src/**/*.ts' --fix",
    "format": "prettier --write 'src/**/*.ts'",
    "format:check": "prettier --check 'src/**/*.ts'"
  }
}
```

### Step 5: Create a Pre-commit Hook for Automatic Formatting

1. Install Husky and lint-staged:

```bash
npm install --save-dev husky lint-staged
```

2. Add the following to your `package.json`:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.ts": [
      "prettier --write",
      "eslint --fix",
      "git add"
    ]
  }
}
```

### Step 6: Update CI/CD Pipeline to Check Code Style

Add the following steps to your CI/CD pipeline (e.g., in `.github/workflows/main.yml`):

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '14'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
```

## 4. Example of Changes

Here's an example of how the code style changes might look:

Before:

```typescript
function get_user_data(USER_ID: string) {
  let user_name = "John Doe";
  let Age = 30;
  return { user_name, Age };
}
```

After:

```typescript
function getUserData(userId: string) {
  const userName = 'John Doe';
  const age = 30;
  return { userName, age };
}
```

## 5. Potential Challenges and Solutions

1. **Large codebase**: For large projects, updating all variable and function names manually can be time-consuming. Consider using automated refactoring tools or scripts to assist with the process.

2. **Team adoption**: Ensure all team members are aware of the new code style guidelines and have their development environments set up correctly.

3. **Integration with existing tools**: Make sure the new ESLint and Prettier configurations don't conflict with any existing linting or formatting tools in use.

4. **Performance impact**: Running linters and formatters on pre-commit hooks can slow down the commit process. Consider using lint-staged to only process changed files.

## 6. Conclusion

Implementing a consistent code style using camelCase for variable and function names, along with Prettier for code formatting, will significantly improve the project's maintainability and readability. The automated tools and pre-commit hooks will ensure that the code style is consistently applied across the entire codebase.

Remember to communicate these changes to all team members and update any relevant documentation or contribution guidelines to reflect the new code style requirements.

---

# Implement Documentation

## 1. Detailed Analysis

Implementing comprehensive documentation is crucial for the maintainability, usability, and adoption of the QLLM project. This chapter will focus on three main aspects:

1. Setting up TypeDoc for API documentation
2. Creating README files for each package and the root directory
3. Documenting usage examples and configuration options

### Current State
- Limited or inconsistent documentation across the project
- Lack of API documentation
- Missing or outdated README files
- Insufficient usage examples and configuration documentation

### Benefits of Improved Documentation
- Easier onboarding for new developers
- Improved maintainability
- Better user experience for CLI users
- Increased adoption and community engagement

## 2. Implementation Plan

1. Set up TypeDoc for API documentation
2. Create and update README files
3. Document usage examples and configuration options
4. Implement a documentation build process
5. Set up automated documentation deployment

## 3. Detailed Implementation

### 3.1 Set up TypeDoc for API documentation

1. Install TypeDoc and related packages:

```bash
npm install --save-dev typedoc typedoc-plugin-markdown
```

2. Create a TypeDoc configuration file `typedoc.json` in the root directory:

```json
{
  "entryPoints": ["packages/qllm-core/src/index.ts", "packages/qllm-cli/src/index.ts"],
  "out": "docs/api",
  "name": "QLLM API Documentation",
  "theme": "default",
  "plugin": ["typedoc-plugin-markdown"],
  "excludePrivate": true,
  "excludeProtected": true,
  "excludeExternals": true,
  "includeVersion": true,
  "readme": "none"
}
```

3. Add TypeDoc scripts to the root `package.json`:

```json
{
  "scripts": {
    "docs:generate": "typedoc",
    "docs:serve": "npx http-server docs/api"
  }
}
```

4. Update source files with JSDoc comments:

```typescript
// packages/qllm-core/src/core/providers/llm_provider.ts

/**
 * Represents the options for an LLM provider.
 */
export interface LLMProviderOptions {
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Temperature for response generation */
  temperature?: number;
  /** Top P for response generation */
  topP?: number;
  /** Top K for response generation */
  topK?: number;
  /** System message to set context */
  system?: string;
  /** Model to use for generation */
  model: string;
}

/**
 * Represents an LLM provider.
 */
export interface LLMProvider {
  /**
   * Generates a message using the LLM.
   * @param messages - The input messages.
   * @param options - The provider options.
   * @returns A promise that resolves to the generated message.
   */
  generateMessage: (messages: Message[], options: LLMProviderOptions) => Promise<string>;

  /**
   * Streams a message from the LLM.
   * @param messages - The input messages.
   * @param options - The provider options.
   * @returns An async iterable of message chunks.
   */
  streamMessage: (messages: Message[], options: LLMProviderOptions) => AsyncIterableIterator<string>;
}
```

### 3.2 Create and update README files

1. Create a root `README.md`:

```markdown
# QLLM - Multi-Provider LLM Command CLI

QLLM is a powerful command-line interface (CLI) tool for interacting with various Large Language Models (LLMs) from different providers.

## Features

- Support for multiple LLM providers (OpenAI, Anthropic, Ollama, etc.)
- Interactive chat mode
- Streaming responses
- Template management
- Configurable options

## Installation

```bash
npm install -g qllm
```

## Quick Start

```bash
qllm ask "What is the capital of France?"
```

For more detailed usage instructions and examples, please refer to the [CLI Documentation](packages/qllm-cli/README.md).

## Packages

- [qllm-cli](packages/qllm-cli/README.md): The CLI tool for QLLM
- [qllm-core](packages/qllm-core/README.md): Core functionality and provider implementations

## Documentation

- [API Documentation](docs/api/index.md)
- [Configuration Guide](docs/configuration.md)
- [Provider Setup](docs/provider-setup.md)

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for more details.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.
```

2. Create `packages/qllm-cli/README.md`:

```markdown
# QLLM CLI

The command-line interface for QLLM, allowing interaction with various LLM providers.

## Installation

```bash
npm install -g qllm
```

## Usage

### Ask a question

```bash
qllm ask "What is the capital of France?"
```

### Start an interactive chat session

```bash
qllm chat
```

### Stream a response

```bash
qllm stream "Tell me a story about a brave knight"
```

### Manage templates

```bash
qllm template list
qllm template create
qllm template execute my-template
```

For more detailed usage instructions and examples, please refer to the [CLI Documentation](../../docs/cli-usage.md).

## Configuration

QLLM can be configured using a `.qllmrc.yaml` file in your home directory or by using the `qllm config` command. For more information, see the [Configuration Guide](../../docs/configuration.md).

## Contributing

Contributions are welcome! Please see our [Contributing Guide](../../CONTRIBUTING.md) for more details.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](../../LICENSE) file for details.
```

3. Create `packages/qllm-core/README.md`:

```markdown
# QLLM Core

Core functionality and provider implementations for QLLM.

## Installation

```bash
npm install @qllm/core
```

## Usage

```typescript
import { ProviderFactory, LLMProvider } from '@qllm/core';

async function main() {
  const provider: LLMProvider = await ProviderFactory.getProvider('openai');
  const response = await provider.generateMessage([{ role: 'user', content: 'Hello, world!' }], { model: 'gpt-3.5-turbo' });
  console.log(response);
}

main();
```

For more detailed usage instructions and examples, please refer to the [API Documentation](../../docs/api/index.md).

## Contributing

Contributions are welcome! Please see our [Contributing Guide](../../CONTRIBUTING.md) for more details.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](../../LICENSE) file for details.
```

### 3.3 Document usage examples and configuration options

1. Create `docs/cli-usage.md`:

```markdown
# QLLM CLI Usage Guide

This guide provides detailed information on how to use the QLLM CLI tool.

## Basic Commands

### Ask a question

```bash
qllm ask "What is the capital of France?"
```

Options:
- `-t, --max-tokens <number>`: Maximum number of tokens to generate
- `--temperature <number>`: Temperature for response generation
- `--top-p <number>`: Top P for response generation
- `--top-k <number>`: Top K for response generation
- `-s, --system <message>`: System message to set context
- `-f, --file <path>`: Path to input file
- `-o, --output <path>`: Path to output file
- `--format <format>`: Output format (json, markdown, text)

### Start an interactive chat session

```bash
qllm chat
```

Options:
- `-t, --max-tokens <number>`: Maximum number of tokens to generate
- `--temperature <number>`: Temperature for response generation
- `--top-p <number>`: Top P for response generation
- `--top-k <number>`: Top K for response generation
- `-s, --system <message>`: System message to set context

### Stream a response

```bash
qllm stream "Tell me a story about a brave knight"
```

Options:
- `-t, --max-tokens <number>`: Maximum number of tokens to generate
- `--temperature <number>`: Temperature for response generation
- `--top-p <number>`: Top P for response generation
- `--top-k <number>`: Top K for response generation
- `-s, --system <message>`: System message to set context
- `-f, --file <path>`: Path to input file
- `-o, --output <path>`: Path to output file

## Template Management

### List templates

```bash
qllm template list
```

### Create a new template

```bash
qllm template create
```

### Execute a template

```bash
qllm template execute my-template
```

Options:
- `-t, --max-tokens <number>`: Maximum number of tokens to generate
- `--temperature <number>`: Temperature for response generation
- `--top-p <number>`: Top P for response generation
- `--top-k <number>`: Top K for response generation
- `-s, --system <message>`: System message to set context
- `--output [file]`: Output file path
- `--format <format>`: Output format (json, xml)
- `-v, --variable <key=value>`: Set variable values for the template

## Configuration

### Show current configuration

```bash
qllm config --show
```

### Set configuration options

```bash
qllm config --set-profile <profile>
qllm config --set-region <region>
qllm config --set-provider <provider>
qllm config --set-model <model>
qllm config --set-log-level <level>
qllm config --set-max-tokens <tokens>
qllm config --set-prompts-dir <directory>
qllm config --set-model-alias <alias>
qllm config --set-model-id <id>
```

### Enter interactive configuration mode

```bash
qllm config --interactive
```

For more information on configuration options, see the [Configuration Guide](configuration.md).
```

2. Create `docs/configuration.md`:

```markdown
# QLLM Configuration Guide

QLLM can be configured using a `.qllmrc.yaml` file in your home directory or by using the `qllm config` command.

## Configuration File

The `.qllmrc.yaml` file should be placed in your home directory. Here's an example configuration:

```yaml
awsProfile: default
awsRegion: us-west-2
defaultProvider: anthropic
defaultModelAlias: haiku
logLevel: info
defaultMaxTokens: 2048
promptDirectory: ~/.config/qllm/prompts
```

## Configuration Options

- `awsProfile`: The AWS profile to use for services that require AWS credentials
- `awsRegion`: The AWS region to use for services that require AWS credentials
- `defaultProvider`: The default LLM provider to use
- `defaultModelAlias`: The default model alias to use
- `logLevel`: The log level (error, warn, info, debug)
- `defaultMaxTokens`: The default maximum number of tokens to generate
- `promptDirectory`: The directory to store prompt templates

## Using the Config Command

You can use the `qllm config` command to view and update your configuration:

```bash
# Show current configuration
qllm config --show

# Set AWS profile
qllm config --set-profile my-profile

# Set default provider
qllm config --set-provider openai

# Set log level
qllm config --set-log-level debug

# Enter interactive configuration mode
qllm config --interactive
```

For more information on the available configuration options, run:

```bash
qllm config --help
```

## Environment Variables

You can also use environment variables to configure QLLM. The following environment variables are supported:

- `QLLM_AWS_PROFILE`: AWS profile
- `QLLM_AWS_REGION`: AWS region
- `QLLM_DEFAULT_PROVIDER`: Default LLM provider
- `QLLM_DEFAULT_MODEL_ALIAS`: Default model alias
- `QLLM_LOG_LEVEL`: Log level
- `QLLM_DEFAULT_MAX_TOKENS`: Default maximum tokens
- `QLLM_PROMPT_DIRECTORY`: Prompt template directory

Environment variables take precedence over the configuration file.
```

### 3.4 Implement a documentation build process

1. Add a documentation build script to the root `package.json`:

```json
{
  "scripts": {
    "docs:build": "npm run docs:generate && npm run docs:copy-md",
    "docs:copy-md": "cp docs/*.md docs/api/"
  }
}
```

2. Create a `docs:build` script that generates API documentation and copies additional markdown files:

```bash
#!/bin/bash

# Generate API documentation
npm run docs:generate

# Copy additional markdown files to the API documentation directory
cp docs/*.md docs/api/

echo "Documentation build complete."
```

### 3.5 Set up automated documentation deployment

1. Create a GitHub Actions workflow for documentation deployment in `.github/workflows/docs-deploy.yml`:

```yaml
name: Deploy Documentation

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '14'

      - name: Install dependencies
        run: npm ci

      - name: Build documentation
        run: npm run docs:build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/api
```

## 4. Conclusion

By implementing these documentation improvements, the QLLM project will benefit from:

- Comprehensive API documentation generated by TypeDoc
- Clear and informative README files for each package and the root directory
- Detailed usage examples and configuration guides
- An automated process for building and deploying documentation

These enhancements will significantly improve the project's usability, maintainability, and potential for community adoption. Regular updates to the documentation should be encouraged as part of the development process to ensure it remains accurate and valuable to users and contributors.

-----
As an expert in CLI command design, I'll evaluate the current commands and options, and propose improvements for a better version of the QLLM CLI.

Current Structure:
The CLI currently offers several main commands: ask, stream, chat, config, and template. Each command has various options for customization.

Evaluation:

1. Command Structure:
   - Good: The main commands are clear and represent distinct functionalities.
   - Improvement: Consider grouping related commands under subcommands for better organization.

2. Options Consistency:
   - Issue: Some options are repeated across commands (e.g., max-tokens, temperature).
   - Improvement: Implement global options for commonly used parameters.

3. Configuration Management:
   - Good: The config command allows for viewing and updating configuration.
   - Improvement: Add a way to reset configuration to defaults and manage multiple profiles.

4. Template Management:
   - Good: Comprehensive template management with create, list, execute, and delete operations.
   - Improvement: Add version control for templates and the ability to share templates.

5. Output Formatting:
   - Issue: Limited output format options (json, markdown, text).
   - Improvement: Expand output format options and allow for custom formatting templates.

6. Error Handling:
   - Improvement: Implement more granular error codes and provide more detailed error messages.

7. Verbosity Levels:
   - Issue: Current logging levels might not provide enough granularity for debugging.
   - Improvement: Implement more verbose output options for debugging.

Proposed Improved Structure:

```
qllm
├── chat
│   ├── start
│   └── export
├── ask
├── stream
├── config
│   ├── view
│   ├── set
│   ├── reset
│   └── profile
│       ├── create
│       ├── list
│       ├── switch
│       └── delete
├── template
│   ├── create
│   ├── list
│   ├── view
│   ├── edit
│   ├── delete
│   ├── execute
│   ├── export
│   └── import
└── provider
    ├── list
    ├── info
    └── configure

Global Options:
  --verbose, -v       Increase output verbosity (can be used multiple times)
  --quiet, -q         Suppress all output except errors
  --output-format     Specify output format (json, yaml, csv, table, custom)
  --config-file       Specify an alternative config file
  --profile           Specify the configuration profile to use

Common Options (for ask, stream, chat, template execute):
  --model, -m         Specify the model to use
  --provider, -p      Specify the provider to use
  --max-tokens        Set the maximum number of tokens
  --temperature       Set the temperature for response generation
  --top-p             Set the top-p value for response generation
  --top-k             Set the top-k value for response generation
  --system-prompt     Specify a system prompt
```

Key Improvements:

1. Subcommands: Grouped related commands (e.g., config profile) for better organization.
2. Global Options: Introduced global options for verbosity, output format, and profile selection.
3. Common Options: Standardized common options across relevant commands.
4. New Features:
   - Added chat export for saving chat history.
   - Expanded config management with profile support and reset option.
   - Added template import/export for sharing.
   - Introduced a provider command for managing and viewing provider information.
5. Consistency: Ensured consistent naming and structure across all commands.
6. Flexibility: Allowed for custom output formats and increased verbosity levels.

This proposed structure offers a more organized, consistent, and feature-rich CLI experience while maintaining the core functionality of the original design. It provides users with more control over their interactions with the QLLM tool and better supports advanced use cases and debugging.

---
Certainly! I'll create a comprehensive documentation for the new command structure of the QLLM CLI, including detailed explanations and multiple examples for each command and subcommand.

# QLLM CLI Documentation

QLLM (Quantum Language Learning Model) is a powerful command-line interface (CLI) tool for interacting with various Large Language Models (LLMs) from different providers. This documentation covers the usage of the QLLM CLI, its commands, options, and provides examples for each feature.

## Table of Contents

1. [Installation](#installation)
2. [Global Options](#global-options)
3. [Commands](#commands)
   - [chat](#chat)
   - [ask](#ask)
   - [stream](#stream)
   - [config](#config)
   - [template](#template)
   - [provider](#provider)
4. [Common Options](#common-options)
5. [Configuration](#configuration)
6. [Examples](#examples)

## Installation

To install QLLM CLI, run the following command:

```bash
npm install -g qllm
```

## Global Options

These options can be used with any command:

- `--verbose, -v`: Increase output verbosity (can be used multiple times)
- `--quiet, -q`: Suppress all output except errors
- `--output-format`: Specify output format (json, yaml, csv, table, custom)
- `--config-file`: Specify an alternative config file
- `--profile`: Specify the configuration profile to use

## Commands

### chat

The `chat` command starts an interactive chat session with the LLM.

#### Subcommands

- `start`: Start a new chat session
- `export`: Export the chat history

#### Examples

1. Start a new chat session:

```bash
qllm chat start
```

2. Start a chat session with a specific model:

```bash
qllm chat start --model gpt4
```

3. Export chat history:

```bash
qllm chat export --output chat_history.json
```

### ask

The `ask` command sends a single question to the LLM and returns the response.

#### Examples

1. Ask a simple question:

```bash
qllm ask "What is the capital of France?"
```

2. Ask a question with a specific provider and model:

```bash
qllm ask "Explain quantum computing" --provider openai --model gpt4
```

3. Ask a question and save the output to a file:

```bash
qllm ask "Write a short story about a robot" --output story.txt
```

### stream

The `stream` command sends a prompt to the LLM and streams the response in real-time.

#### Examples

1. Stream a response to a prompt:

```bash
qllm stream "Tell me a joke"
```

2. Stream a response with custom parameters:

```bash
qllm stream "Write a poem about spring" --max-tokens 200 --temperature 0.8
```

3. Stream a response and save it to a file:

```bash
qllm stream "Explain the theory of relativity" --output relativity_explanation.txt
```

### config

The `config` command manages the QLLM configuration.

#### Subcommands

- `view`: View current configuration
- `set`: Set configuration options
- `reset`: Reset configuration to defaults
- `profile`: Manage configuration profiles

#### Examples

1. View current configuration:

```bash
qllm config view
```

2. Set default provider:

```bash
qllm config set --provider openai
```

3. Create a new configuration profile:

```bash
qllm config profile create work
```

4. Switch to a different profile:

```bash
qllm config profile switch personal
```

5. Reset configuration to defaults:

```bash
qllm config reset
```

### template

The `template` command manages prompt templates.

#### Subcommands

- `create`: Create a new template
- `list`: List all templates
- `view`: View a specific template
- `edit`: Edit an existing template
- `delete`: Delete a template
- `execute`: Execute a template
- `export`: Export a template
- `import`: Import a template

#### Examples

1. Create a new template:

```bash
qllm template create
```

2. List all templates:

```bash
qllm template list
```

3. View a specific template:

```bash
qllm template view my_template
```

4. Execute a template:

```bash
qllm template execute story_generator --variable genre=sci-fi --variable length=short
```

5. Export a template:

```bash
qllm template export my_template --output my_template.yaml
```

6. Import a template:

```bash
qllm template import new_template.yaml
```

### provider

The `provider` command manages and displays information about LLM providers.

#### Subcommands

- `list`: List all available providers
- `info`: Display information about a specific provider
- `configure`: Configure a provider

#### Examples

1. List all available providers:

```bash
qllm provider list
```

2. Get information about a specific provider:

```bash
qllm provider info openai
```

3. Configure a provider:

```bash
qllm provider configure anthropic --api-key YOUR_API_KEY
```

## Common Options

These options are available for `ask`, `stream`, `chat`, and `template execute` commands:

- `--model, -m`: Specify the model to use
- `--provider, -p`: Specify the provider to use
- `--max-tokens`: Set the maximum number of tokens
- `--temperature`: Set the temperature for response generation
- `--top-p`: Set the top-p value for response generation
- `--top-k`: Set the top-k value for response generation
- `--system-prompt`: Specify a system prompt

## Configuration

QLLM can be configured using a `.qllmrc.yaml` file in your home directory or by using the `qllm config` command. The configuration file supports the following options:

```yaml
awsProfile: default
awsRegion: us-west-2
defaultProvider: anthropic
defaultModelAlias: haiku
logLevel: info
defaultMaxTokens: 2048
promptDirectory: ~/.config/qllm/prompts
```

## Examples

### Complex Usage Scenarios

1. Use a specific provider and model with custom parameters:

```bash
qllm ask "Explain the process of photosynthesis" --provider openai --model gpt4 --max-tokens 500 --temperature 0.7
```

2. Create and execute a template with variables:

```bash
# Create a new template
qllm template create

# Execute the template with variables
qllm template execute science_explainer --variable topic=quantum_entanglement --variable audience=beginners --max-tokens 800
```

3. Start a chat session with a custom system prompt and export the history:

```bash
# Start the chat session
qllm chat start --system-prompt "You are a helpful AI assistant specializing in history." --model gpt4

# Export the chat history after the session
qllm chat export --output history_chat.json
```

4. Stream a response with a specific provider and save to a file:

```bash
qllm stream "Write a short story in the style of Edgar Allan Poe" --provider anthropic --model claude-2 --output poe_story.txt
```

5. Use a configuration profile for a specific project:

```bash
# Create a new profile
qllm config profile create my_project

# Switch to the new profile
qllm config profile switch my_project

# Configure the profile
qllm config set --provider openai --model gpt4

# Use the profile in a command
qllm ask "What are the best practices for code review?" --profile my_project
```

6. Create and use a complex template with file inclusion:

```yaml
# Create a template file named code_review.yaml
name: code_review
version: 1.0.0
description: Perform a code review based on best practices
author: QLLM User
provider: openai
model: gpt4
input_variables:
  language:
    type: string
    description: Programming language of the code
  code:
    type: string
    description: The code to review
content: |
  You are an expert code reviewer for {{language}} programming.
  Please review the following code and provide feedback on:
  1. Code style and formatting
  2. Potential bugs or errors
  3. Performance optimizations
  4. Best practices and design patterns

  Here's the code to review:

  ```{{language}}
  {{code}}
  ```

  Provide your review in a structured format with clear explanations and suggestions for improvement.
```

Now, use the template:

```bash
qllm template execute code_review --variable language=python --variable code="$(cat my_script.py)"
```

This comprehensive documentation covers the main features and usage patterns of the QLLM CLI. Users can refer to this guide to understand how to effectively use the tool for various LLM interactions, configuration management, and template-based operations.

Certainly! I'll provide an updated documentation and specification for executing templates by name or file path in the QLLM CLI.

# QLLM CLI Documentation: Template Execution

## Template Execute Command

The `template execute` command allows you to run a template either by its name (stored in the default template directory) or by specifying a file path to a template file.

### Syntax

```
qllm template execute <name-or-path> [options]
```

### Arguments

- `<name-or-path>`: The name of the template or the file path to the template YAML file.

### Options

- `-v, --variable <key=value>`: Set variable values for the template (can be used multiple times)
- `--output [file]`: Output file path
- `--format <format>`: Output format (json, yaml)
- `--max-tokens <number>`: Maximum number of tokens to generate
- `--temperature <number>`: Temperature for response generation
- `--top-p <number>`: Top P for response generation
- `--top-k <number>`: Top K for response generation
- `--system <message>`: System message to set context

### Examples

1. Execute a template by name:

```bash
qllm template execute my_template --variable key1=value1 --variable key2=value2
```

2. Execute a template from a file path:

```bash
qllm template execute /path/to/my_template.yaml --variable key1=value1 --variable key2=value2
```

3. Execute a template with output to a file:

```bash
qllm template execute my_template --output result.json --format json
```

4. Execute a template with custom LLM parameters:

```bash
qllm template execute my_template --max-tokens 500 --temperature 0.7
```

## Specification for Implementation

To implement the ability to execute templates by name or file path, follow these specifications:

1. Update the `createExecuteCommand` function in `packages/qllm-cli/src/cli/commands/template.ts`:

```typescript
function createExecuteCommand(): Command {
  return new Command("execute")
    .description("Execute a template by name or file path")
    .argument("<name-or-path>", "Name of the template or path to the template file")
    .addOption(new Option("-v, --variable <key=value>", "Set variable values for the template").argParser(collectVariables))
    .addOption(new Option("--output [file]", "Output file path"))
    .addOption(new Option("--format <format>", "Output format").choices(["json", "yaml"]).default("json"))
    .addOption(cliOptions.maxTokensOption)
    .addOption(cliOptions.temperatureOption)
    .addOption(cliOptions.topPOption)
    .addOption(cliOptions.topKOption)
    .addOption(cliOptions.systemOption)
    .action(async (nameOrPath, options) => {
      try {
        const templateManager = await getTemplateManager();
        let template;

        if (path.isAbsolute(nameOrPath) || nameOrPath.startsWith('./') || nameOrPath.startsWith('../')) {
          // It's a file path
          template = await templateManager.loadTemplateFromFile(nameOrPath);
        } else {
          // It's a template name
          template = await templateManager.getTemplate(nameOrPath);
        }

        if (!template) {
          throw new Error(`Template '${nameOrPath}' not found`);
        }

        // Rest of the execution logic...
      } catch (error) {
        ErrorManager.handleError("ExecuteTemplateError", `Failed to execute template: ${error}`);
      }
    });
}
```

2. Add a new method `loadTemplateFromFile` to the `TemplateManager` class in `packages/qllm-core/src/core/templates/template_manager.ts`:

```typescript
async loadTemplateFromFile(filePath: string): Promise<TemplateDefinition | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const template = yaml.load(content) as TemplateDefinition;
    if (!template || typeof template !== "object") {
      ErrorManager.throwError("TemplateManagerError", `Invalid template structure in file: ${filePath}`);
    }
    template.resolved_content = await this.resolveFileInclusions(template.content);
    return template;
  } catch (error) {
    logger.error(`Failed to read template file ${filePath}: ${error}`);
    return null;
  }
}
```

3. Update the error handling to provide clear messages for both cases:

```typescript
if (!template) {
  if (path.isAbsolute(nameOrPath) || nameOrPath.startsWith('./') || nameOrPath.startsWith('../')) {
    throw new Error(`Failed to load template file: ${nameOrPath}`);
  } else {
    throw new Error(`Template '${nameOrPath}' not found in the template directory`);
  }
}
```

4. Ensure that the `resolveFileInclusions` method in `TemplateManager` can handle both relative and absolute paths:

```typescript
private async resolveFileInclusions(content: string, basePath: string = this.templateDir): Promise<string> {
  // ... existing code ...

  const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(basePath, filePath.trim());

  // ... rest of the method ...
}
```

By implementing these changes, the QLLM CLI will be able to distinguish between executing templates by name (stored in the default template directory) and by file path, providing a flexible way for users to run their templates.

