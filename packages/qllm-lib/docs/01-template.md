# QLLM Templates: Advanced Guide

## 1. Introduction to QLLM Templates

QLLM Templates are powerful tools for creating flexible and reusable prompts for Large Language Models (LLMs). They allow developers to define structured prompts with dynamic variables, making it easy to generate consistent and customizable content across various use cases.

### 1.1 What are QLLM Templates?

QLLM Templates are structured definitions of prompts that can be used with Large Language Models. They provide a way to standardize and parameterize interactions with LLMs, allowing for more consistent and controllable outputs.

### 1.2 Why use QLLM Templates?

- Reusability: Define prompts once and use them multiple times with different inputs.
- Consistency: Ensure uniform prompt structure across your application.
- Flexibility: Easily modify prompts by changing variables or included content.
- Structured Outputs: Define expected output formats for easier parsing and integration.

## 2. Template Structure

A typical QLLM template consists of several components:

### 2.1 Metadata components

- Title: A descriptive name for the template
- Version: The template version number
- Description: A brief explanation of the template's purpose
- Author: The creator of the template

### 2.2 Input variables

Input variables are placeholders in the prompt that can be filled with different values each time the template is used. They are defined with a name, type, and description.

### 2.3 Prompt content

The actual text of the prompt, including placeholders for input variables.

### 2.4 Output variables

Definitions of the expected structure of the LLM's response, often using XML tags for easy parsing.

### 2.5 Tags and categories

Labels and groupings to help organize and search for templates.

### 2.6 Model and parameter specifications

Settings for the LLM, such as the model to use and parameters like max_tokens, temperature, and top_p.

## 3. Creating Templates with TemplateDefinitionBuilder

QLLM Templates are created using the TemplateDefinitionBuilder class. This builder pattern allows for a fluent and intuitive way of defining templates.

### 3.1 Basic template creation

```typescript
const template = TemplateDefinitionBuilder.create(
  'Template Name',
  '1.0.0',
  'Template Description',
  'Author Name'
)
.withPrompt('Your prompt text here')
.build();
```

### 3.2 Adding input variables

```typescript
.withInputVariable('variableName', 'string', 'Description of the variable')
.withInputVariable('anotherVariable', 'boolean', 'Description', { default: true })
```

### 3.3 Defining the prompt

```typescript
.withPrompt(`
  Your prompt text here with {{variableName}} placeholders.
  You can use multiple lines for complex prompts.
`)
```

### 3.4 Specifying output variables

```typescript
.withOutputVariable('outputName', 'string', { description: 'Description of the output' })
```

### 3.5 Setting tags and categories

```typescript
.withTags('tag1', 'tag2', 'tag3')
.withCategories('Category1', 'Category2')
```

### 3.6 Configuring model and parameters

```typescript
.withModel('gpt-4')
.withParameters({ max_tokens: 500, temperature: 0.7, top_p: 0.95 })
```

## 4. Practical Examples

### 4.1 Code Generation Template

```typescript
const codeGenerator = TemplateDefinitionBuilder.create(
  'Multi-Language Code Generator',
  '3.0.0',
  'Generate code snippets in various programming languages',
  'CodeMaster AI'
)
.withPrompt(`
Generate a {{language}} code snippet that accomplishes the following task:
{{task_description}}

Requirements:
{{requirements}}

Important: Wrap the generated code in an XML tag named <code></code>.

Generated Code:
`)
.withInputVariable('language', 'string', 'The programming language to generate code in')
.withInputVariable('task_description', 'string', 'Description of the coding task')
.withInputVariable('requirements', 'string', 'Specific requirements for the code')
.withOutputVariable('code', 'string', { description: 'The generated code snippet' })
.withTags('programming', 'code generation', 'multi-language')
.withCategories('Software Development', 'AI-Assisted Coding')
.withModel('gpt-4')
.withParameters({ max_tokens: 500, temperature: 0.7, top_p: 0.95 })
.withPromptType('code_generation')
.withTaskDescription('Generate code snippets in various programming languages based on user requirements')
.withExampleOutputs(`
<code>
def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)
</code>
`)
.build();
```

### 4.2 Interactive Story Generator

```typescript
const interactiveStoryGenerator = TemplateDefinitionBuilder.create(
  'Interactive Story Generator',
  '4.0.0',
  'Generate interactive stories with branching paths',
  'StoryTeller AI'
)
.withPrompt(`
Create an interactive story segment based on the following:

Current scene: {{current_scene}}
Player choice: {{player_choice}}
Story theme: {{theme}}
Character names: {{character_names}}

Generate a story segment that continues the narrative based on the player's choice.

Wrap the generated story segment in <story_segment></story_segment> XML tags.
Provide two possible next choices for the player, each wrapped in <choice></choice> XML tags.

Generated Story Segment and Choices:
`)
.withInputVariable('current_scene', 'string', 'Description of the current scene')
.withInputVariable('player_choice', 'string', 'The choice made by the player')
.withInputVariable('theme', 'string', 'The overall theme of the story')
.withInputVariable('character_names', 'array', 'List of character names in the story')
.withOutputVariable('story_segment', 'string', { description: 'The generated story segment' })
.withOutputVariable('next_choices', 'array', { description: 'Array of possible next choices for the player' })
.withTags('interactive', 'storytelling', 'branching-narrative')
.withCategories('Entertainment', 'AI-Assisted Writing')
.withModel('gpt-4')
.withParameters({ max_tokens: 1000, temperature: 0.8, top_p: 0.9 })
.build();
```

## 5. Executing Templates

To execute a template, use the TemplateExecutor class:

```typescript
import { TemplateExecutor, getLLMProvider } from 'qllm-lib';

async function executeTemplate(template, variables) {
  const provider = await getLLMProvider('openai');
  const templateExecutor = new TemplateExecutor();

  const result = await templateExecutor.execute(template, provider, variables);

  console.log('Generated Output:', result);
}

// Example usage
executeTemplate(codeGenerator, {
  language: 'python',
  task_description: 'Create a function that calculates the nth Fibonacci number',
  requirements: 'Use recursion and include error handling for negative inputs'
});
```

## 6. Advanced Techniques

### 6.1 Using XML tags for structured outputs

XML tags in the prompt help structure the LLM's output, making it easier to parse and use in your application.

### 6.2 Template inclusion

You can include external content in your templates using the `{{file:./path/to/file.md}}` syntax.

### 6.3 Custom input validators

Define custom validation logic for input variables:

```typescript
.withCustomInputValidator('language', (value: string) => {
  const supportedLanguages = ['python', 'javascript', 'java', 'c++', 'ruby'];
  return supportedLanguages.includes(value.toLowerCase());
})
```

## 7. Best Practices

- Keep prompts clear and concise
- Use descriptive names for input and output variables
- Leverage tags and categories for better organization
- Provide example outputs to guide the LLM
- Use XML tags for structured outputs when needed
- Optimize token usage by being specific in your prompts

By following these guidelines and utilizing the powerful features of QLLM Templates, you can create sophisticated, reusable prompts that generate high-quality, structured outputs from Large Language Models.
