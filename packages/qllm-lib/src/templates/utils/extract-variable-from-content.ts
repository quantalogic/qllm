import { TemplateVariable } from "../types";

interface ExtractVariablesFromContentOptions {
  allowDotNotation?: boolean;
  allowBracketNotation?: boolean;
  allowFunctionCalls?: boolean;
}

export function extractVariablesFromContent(
  {
    content,
    input_variables = {} as Record<string, TemplateVariable>,
  }: {
    content: string; // Make content mandatory
    input_variables?: Record<string, TemplateVariable>;
  },
  options: ExtractVariablesFromContentOptions = {
    allowDotNotation: true,
    allowBracketNotation: false,
    allowFunctionCalls: false,
  }
): Record<string, TemplateVariable> { // Specify return type
  // Destructure options with default values
  const { allowDotNotation, allowBracketNotation, allowFunctionCalls } = options;

  // Define patterns for variable names and notations
  const variableNamePattern = '[a-zA-Z_$][\\w$]*';
  const dotNotationPattern = allowDotNotation ? `(?:\\.${variableNamePattern})*` : '';
  const bracketNotationPattern = allowBracketNotation ? '(?:\\[(?:[^\\[\\]]*|\\[[^\\[\\]]*\\])*\\])*' : '';
  const functionCallPattern = allowFunctionCalls ? '(?:\\([^()]*\\))?' : '';

  // Create a regex pattern to match variables within double curly braces
  const variablePattern = new RegExp(
    `{{\\s*(${variableNamePattern}${dotNotationPattern}${bracketNotationPattern}${functionCallPattern})\\s*}}`,
    'g'
  );

  // Clone input_variables to avoid mutating the original object
  const clonedInputVariables = { ...input_variables };
  const uniqueVariables = new Set<string>();
  let match: RegExpExecArray | null;

  try {
    // Execute regex to find all matches in the content
    while ((match = variablePattern.exec(content)) !== null) {
      const variableExpression = match[1].trim();
      const rootVariable = variableExpression.split(/[.[(]/)[0];
      uniqueVariables.add(rootVariable);
    }

    // Update clonedInputVariables with found variables if they are not already defined
    uniqueVariables.forEach((variable) => {
      if (!clonedInputVariables[variable]) {
        clonedInputVariables[variable] = {
          type: 'string',
          description: `Variable ${variable} found in content`,
          inferred: true,
        };
      }
    });
  } catch (error) {
    console.error('Error extracting variables:', error);
  }

  return clonedInputVariables; // Return the cloned input_variables
}