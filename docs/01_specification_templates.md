# Prompt Template Feature Specification 1.0

## Overview

The prompt template feature allows users to define, manage, use, and share custom prompts for content generation across various LLM providers. Templates are stored in a structured format, providing a user-friendly, flexible, and powerful way to create, edit, and utilize prompts. This system now includes support for specifying and extracting output variables using XML tags.

## Template Structure

Templates are stored as YAML files with the following enhanced structure:

```yaml
name: example_template
version: 1.0.0
category: summarization
tags: 
  - text
  - concise
  - general
author: John Doe
email: john.doe@example.com
created: 2024-07-03
last_modified: 2024-07-03
description: A template for summarizing text in a concise manner
license: MIT
provider: anthropic
model: claude-3-haiku-20240307-v1:0
input_variables:
  text: 
    type: string
    description: Input text to summarize
    default: ""
  max_length:
    type: integer
    description: Maximum number of sentences in the summary
    default: 3
output_variables:
  summary:
    type: string
    description: The generated summary
    version: 1.0
    cache_ttl: 3600
  key_points:
    type: array
    description: List of key points extracted from the text
    version: 1.1
parameters:
  max_tokens: 256
  temperature: 0.7
  top_p: 1
  top_k: 250
output_transformations:
  summary:
    - lowercase
    - trim
  key_points:
    - sort
    - unique
content: |
  Summarize the following text:

  {{text}}

  Provide a concise summary in no more than {{max_length}} sentences.

  Output your response in the following format:

  <summary>
  [Your summary here]
  </summary>

  <key_points>
  - [Key point 1]
  - [Key point 2]
  - [Key point 3]
  </key_points>
```

## Enhanced Features

### 1. Versioning System
- Git-like versioning system for templates.
- View version history, compare versions, and revert to previous versions.
- Command: `qllm template version <name> [--list|--diff <v1> <v2>|--revert <version>]`

### 2. Template Testing
- Testing framework for templates, including output variable validation.
- Command: `qllm template test <name> [--input <file>] [--expected <file>]`
- Define test cases with input, expected output, and output variable expectations.

### 3. Collaboration and Sharing
- Team-based template sharing.
- Template permissions (read, write, execute) for team members.
- Command: `qllm template share <name> --team <team_name> [--permission <permission>]`

### 4. Advanced Template Discovery
- Enhanced list command with advanced filtering and sorting.
- Command: `qllm template list [--category <category>] [--tag <tag>] [--author <author>] [--sort <field>] [--search <query>]`

### 5. Template Composition
- Templates can include or extend other templates.
- Syntax: `{{include:template_name}}` or `{{extend:template_name}}`

### 6. Cross-Provider Compatibility
- Provider-agnostic section in templates.
- Provider-specific overrides.
```yaml
provider_agnostic:
  content: |
    Generic prompt content here
provider_specific:
  anthropic:
    content: |
      Anthropic-specific content here
  openai:
    content: |
      OpenAI-specific content here
```

### 7. Template Analytics
- Usage statistics tracking for templates.
- User ratings and feedback for templates.
- Command: `qllm template stats <name> [--period <time_period>]`

### 8. Import/Export Functionality
- Import and export templates.
- Export multiple templates as a package.
- Commands: 
  - `qllm template import <file_or_url>`
  - `qllm template export <name> [--format <format>]`

### 9. Dynamic Variables
- Support for dynamic variables populated programmatically.
- Variables sourced from environment variables or external APIs.
```yaml
input_variables:
  current_date:
    type: dynamic
    source: datetime.now().strftime('%Y-%m-%d')
  weather:
    type: dynamic
    source: api:https://api.weather.com/current?location={{location}}
```

### 10. Standardized Categories and Tags
- Predefined set of categories and popular tags.
- Custom tags allowed, with encouragement to use standardized ones.

### 11. Output Variables
- Define expected output variables in the template.
- Use XML tags in the content section to specify output variable placeholders.
- Support for nested output variables.
- Output variable versioning.
- Caching mechanism for output variables.

### 12. Output Transformations
- Define transformations to be applied to output variables before returning results.

## Implementation Details

### 1. Template Storage
- Store templates in `~/.qllm/templates/` as YAML files.
- Use a SQLite database for faster querying and analytics.

### 2. Template Management
Enhanced commands:
- `qllm template create <name>`: Interactive template creation wizard
- `qllm template edit <name>`: Open template in default YAML editor
- `qllm template delete <name>`: Delete a template with confirmation
- `qllm template clone <source> <destination>`: Create a copy of a template

### 3. Template Parsing
- YAML parser to extract metadata and content from template files.
- Custom parser for handling template composition, dynamic variables, and output variables.
- XML parser for extracting output variable values from LLM responses.

### 4. Template Usage
Modified commands to support enhanced template usage:
- `qllm ask --template <name> [--var key=value...] [--output-format json|yaml]`
- `qllm stream --template <name> [--var key=value...] [--output-format json|yaml]`
- `qllm chat --template <name>`: Load a template at the start of a chat session

### 5. Error Handling and Validation
- Comprehensive error checking and validation for all template operations.
- Clear, actionable error messages for users.
- Output variable validation against defined types and constraints.

### 6. Performance Optimization
- Caching mechanism for parsed templates to reduce load times.
- Background jobs for analytics and non-critical operations.
- Output variable caching based on defined TTL.

### 7. API Integration
- RESTful API for template management, allowing integration with other tools and services.

### 8. Documentation and Onboarding
- Comprehensive documentation covering all aspects of the template system.
- Interactive tutorials and example templates to help users get started quickly.

## File Structure

```
src/
├── commands/
│   ├── ask.ts
│   ├── stream.ts
│   ├── chat.ts
│   └── template/
│       ├── create.ts
│       ├── edit.ts
│       ├── delete.ts
│       ├── list.ts
│       ├── version.ts
│       ├── test.ts
│       ├── share.ts
│       ├── stats.ts
│       ├── import.ts
│       └── export.ts
├── utils/
│   ├── template_manager.ts
│   ├── template_parser.ts
│   ├── template_validator.ts
│   ├── template_versioning.ts
│   ├── template_analytics.ts
│   └── output_variable_processor.ts
├── types/
│   └── template.ts
└── api/
    └── template_routes.ts
```

## Implementation Steps

1. Refactor existing template implementation to use enhanced YAML format with input and output variables.
2. Implement core functionality: parsing, validation, and basic CRUD operations.
3. Develop versioning system and testing framework, including output variable testing.
4. Implement collaboration features and sharing mechanism.
5. Enhance discovery and search capabilities.
6. Develop template composition and cross-provider compatibility features.
7. Implement analytics and rating system.
8. Add import/export functionality.
9. Develop support for dynamic variables and output variables.
10. Implement output variable parsing, validation, and transformation.
11. Create standardized categories and tags.
12. Optimize performance with caching and background jobs, including output variable caching.
13. Develop RESTful API for template management.
14. Create comprehensive documentation and tutorials, including sections on output variables and XML tags.
15. Conduct thorough testing, including unit tests, integration tests, and user acceptance testing.

## Conclusion

This enhanced specification provides a comprehensive and powerful template system that addresses the limitations of the original proposal while incorporating new features like output variables and transformations. It offers advanced features such as versioning, testing, collaboration, and analytics, while maintaining ease of use. The modular implementation approach allows for phased development and rollout of features based on user feedback and priorities. The addition of output variables with XML tags provides a clear way to specify and extract structured information from LLM responses, making it easier for users to work with generated content programmatically.