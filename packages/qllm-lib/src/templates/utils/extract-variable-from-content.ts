import { TemplateVariable } from '../types';

interface ExtractVariablesFromContentOptions {
  allowDotNotation?: boolean;
  allowBracketNotation?: boolean;
  allowFunctionCalls?: boolean;
}

class Parser {
  private input: string;
  private index: number;
  private options: ExtractVariablesFromContentOptions;

  constructor(input: string, options: ExtractVariablesFromContentOptions) {
    this.input = input;
    this.index = 0;
    this.options = options;
  }

  private peek(): string {
    return this.input[this.index] || '';
  }

  private consume(): string {
    return this.input[this.index++] || '';
  }

  private match(expected: string): boolean {
    if (this.input.startsWith(expected, this.index)) {
      this.index += expected.length;
      return true;
    }
    return false;
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.peek())) {
      this.consume();
    }
  }

  parse(): Set<string> {
    const variables = new Set<string>();
    while (this.index < this.input.length) {
      if (this.match('{{')) {
        const variable = this.parseVariableExpression();
        if (variable) {
          variables.add(variable);
        }
      } else {
        this.consume();
      }
    }
    return variables;
  }

  private parseVariableExpression(): string | null {
    this.skipWhitespace();
    const variable = this.parseVariable();
    if (!variable) return null;
    this.skipWhitespace();
    if (!this.match('}}')) return null;
    return variable;
  }

  private parseVariable(): string | null {
    const rootVariable = this.parseIdentifier();
    if (!rootVariable) return null;
    let result = rootVariable;
    let extension = this.parseVariableExtension();
    while (extension) {
      result += extension;
      extension = this.parseVariableExtension();
    }
    return result.split(/[.[(]/)[0]; // Return only the root variable
  }

  private parseVariableExtension(): string | null {
    return this.parseDotNotation() || this.parseBracketNotation() || this.parseFunctionCall();
  }

  private parseIdentifier(): string | null {
    const start = this.index;
    if (/[a-zA-Z_$]/.test(this.peek())) {
      this.consume();
      while (/[a-zA-Z0-9_$]/.test(this.peek())) {
        this.consume();
      }
      return this.input.slice(start, this.index);
    }
    return null;
  }

  private parseDotNotation(): string | null {
    if (!this.options.allowDotNotation) return null;
    if (this.match('.')) {
      const identifier = this.parseIdentifier();
      if (identifier) {
        return '.' + identifier;
      }
    }
    return null;
  }

  private parseBracketNotation(): string | null {
    if (!this.options.allowBracketNotation) return null;
    if (this.match('[')) {
      const start = this.index;
      let bracketCount = 1;
      while (bracketCount > 0 && this.index < this.input.length) {
        if (this.peek() === '[') bracketCount++;
        if (this.peek() === ']') bracketCount--;
        this.consume();
      }
      if (bracketCount === 0) {
        return this.input.slice(start - 1, this.index);
      }
    }
    return null;
  }

  private parseFunctionCall(): string | null {
    if (!this.options.allowFunctionCalls) return null;
    if (this.match('(')) {
      const start = this.index;
      let parenCount = 1;
      while (parenCount > 0 && this.index < this.input.length) {
        if (this.peek() === '(') parenCount++;
        if (this.peek() === ')') parenCount--;
        this.consume();
      }
      if (parenCount === 0) {
        return this.input.slice(start - 1, this.index);
      }
    }
    return null;
  }
}

export function extractVariablesFromContent(
  {
    content,
    input_variables = {},
  }: { content: string; input_variables?: Record<string, TemplateVariable> },
  options: ExtractVariablesFromContentOptions = {
    allowDotNotation: true,
    allowBracketNotation: false,
    allowFunctionCalls: false,
  },
): Record<string, TemplateVariable> {
  const clonedInputVariables = { ...input_variables };
  const parser = new Parser(content, options);
  const uniqueVariables = parser.parse();

  try {
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

  return clonedInputVariables;
}
