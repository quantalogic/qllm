## Output Variable Specification for qllm Templates

### 1. Overview

The output_variable feature in qllm templates allows users to define the structure and characteristics of the expected output from a language model. This specification outlines the implementation and usage of output variables within the qllm template system.

### 2. Structure

Output variables are defined within the `output_variables` section of a qllm template YAML file. Each output variable is represented as a key-value pair, where the key is the variable name and the value is an object containing the variable's properties.

### 3. Properties

Each output variable can have the following properties:

#### 3.1 Type
- **Description**: Specifies the data type of the output variable.
- **Required**: Yes
- **Possible values**: string, integer, float, boolean, array, object

#### 3.2 Description
- **Description**: Provides a human-readable explanation of the output variable's purpose or content.
- **Required**: No, but recommended for clarity
- **Type**: string

#### 3.3 Default (optional)
- **Description**: Specifies a default value for the output variable if not provided by the model.
- **Required**: No
- **Type**: Must match the specified type of the variable

### 4. Example

```yaml
input_variables:
    review: string
output_variables:
  sentiment:
    type: string
    description: Overall sentiment (positive, negative, neutral)
  score:
    type: float
    description: Sentiment score from -1 (very negative) to 1 (very positive)
```

### 5. Usage in Template Content

Output variables are referenced in the template content section using double curly braces with the "output:" prefix: `{{output:variable_name}}`. This allows for dynamic formatting of the output based on the defined variables and distinguishes them from input variables.

Example:

```yaml
content: |
  Analyze the sentiment of the following review:
  "{{review}}"

  Provide your response in the following format:
  Overall sentiment: <sentiment></sentiment>
  Sentiment score: <score></score>
```

### 6. Integration with Workflows

Output variables from one template can be used as input for subsequent templates in a workflow. This is achieved by referencing the output using the syntax `$template_name.variable_name`.

### 7. Validation

The qllm system should validate the output received from the language model against the defined output variables, ensuring type consistency and applying any specified transformations.

### 8. Error Handling

If the language model output does not conform to the specified output variables (e.g., missing required variables or type mismatches), the system should provide clear error messages and optionally fall back to default values if specified.
