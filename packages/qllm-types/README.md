# QLLM Types

## Overview
QLLM Types is a TypeScript library that provides type definitions for the QLLM library, facilitating interaction with various Large Language Model (LLM) providers.

## Types

### 1. ModelAlias
Represents a model alias and its corresponding model ID.
```typescript
interface ModelAlias {
  alias: string;      // The alias name for the model
  modelId: string;   // The actual model ID
  parameters: object; // Allowed parameters
}
```

### 2. ProviderConfig
Configuration for a specific LLM provider.
```typescript
interface ProviderConfig {
  name: string;                // The name of the provider
  models: ModelAlias[];        // Array of model aliases supported by this provider
  defaultModel: string;        // The default model alias for this provider
}
```

### 3. AppConfig
Application configuration interface.
```typescript
interface AppConfig {
  awsProfile: string;         // AWS profile to use
  awsRegion: string;          // AWS region to use
  defaultProvider: ProviderName; // Default LLM provider
  defaultModelId?: string;    // Specific model ID to use
  promptDirectory: string;     // Prompt directory
  logLevel: string;           // Log level
  defaultMaxTokens: number;    // Default maximum tokens
  defaultModelAlias: string;   // Default model alias
}
```

### 4. MessageRole
Defines roles in conversations.
```typescript
type MessageRole = 'user' | 'assistant' | 'system';
```

### 5. Message
Structure for a message.
```typescript
interface Message {
  role: MessageRole;         // Role of the message sender
  content: string;           // Content of the message
}
```

### 6. LLMProviderOptions
Options for an LLM provider.
```typescript
interface LLMProviderOptions {
  maxTokens?: number;       // Maximum number of tokens to generate
  temperature?: number;     // Temperature for response generation
  topP?: number;            // Top P for response generation
  topK?: number;            // Top K for response generation
  system?: string;          // System message to set context
  model: string;            // Model to use for generation
  awsRegion?: string;       // AWS region
  awsProfile?: string;      // AWS profile
  tools?: z.infer;          // Tools data
  imagePath?: string;       // Image path
}
```

### 7. TemplateDefinition
Represents the definition of a template.
```typescript
interface TemplateDefinition {
  name: string;                // The name of the template
  version: string;             // The version of the template
  description: string;         // A description of the template
  author: string;              // The author of the template
  provider: ProviderName;      // The provider to be used for this template
  model: string;               // The model to be used for this template
  input_variables: Record;     // Input variables for the template
  output_variables?: Record;   // Output variables for the template
  content: string;             // The content of the template
  parameters?: {               // Optional parameters for the template execution
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
}
```

## License
This project is licensed under the Apache-2.0 License.

## Contact
For more information, visit the [QuantaLogic website](https://quantalogic.com) or check out the [GitHub repository](https://github.com/quantalogic/qllm).