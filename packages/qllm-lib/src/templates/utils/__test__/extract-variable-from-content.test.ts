import { TemplateValidator } from '../../template-validator';
import { TemplateVariable } from '../../types';
import { extractVariablesFromContent } from '../extract-variable-from-content';

describe('extractVariablesFromContent', () => {
  const defaultOptions = {
    allowDotNotation: true,
    allowBracketNotation: false,
    allowFunctionCalls: false,
  };

  it('should extract a simple variable', () => {
    const content = 'Hello {{name}}';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({
      name: {
        type: 'string',
        description: 'Variable name found in content',
        inferred: true,
      },
    });
  });

  it('should extract multiple variables', () => {
    const content = '{{firstName}} {{lastName}}';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({
      firstName: {
        type: 'string',
        description: 'Variable firstName found in content',
        inferred: true,
      },
      lastName: {
        type: 'string',
        description: 'Variable lastName found in content',
        inferred: true,
      },
    });
  });

  it('should extract variables with dot notation', () => {
    const content = '{{user.name}}';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({
      user: {
        type: 'string',
        description: 'Variable user found in content',
        inferred: true,
      },
    });
  });

  it('should not extract variables with bracket notation when disabled', () => {
    const content = '{{array[0]}}';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({});
  });

  it('should extract variables with bracket notation when enabled', () => {
    const content = '{{array[0]}}';
    const options = { ...defaultOptions, allowBracketNotation: true };
    const result = extractVariablesFromContent({ content }, options);
    expect(result).toEqual({
      array: {
        type: 'string',
        description: 'Variable array found in content',
        inferred: true,
      },
    });
  });

  it('should not extract function calls when disabled', () => {
    const content = '{{func()}}';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({});
  });

  it('should extract function calls when enabled', () => {
    const content = '{{func()}}';
    const options = { ...defaultOptions, allowFunctionCalls: true };
    const result = extractVariablesFromContent({ content }, options);
    expect(result).toEqual({
      func: {
        type: 'string',
        description: 'Variable func found in content',
        inferred: true,
      },
    });
  });

  it('should handle empty content', () => {
    const content = '';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({});
  });

  it('should handle content without variables', () => {
    const content = 'No variables here';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({});
  });

  it('should handle whitespace in variable names', () => {
    const content = '{{  whitespace  }}';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({
      whitespace: {
        type: 'string',
        description: 'Variable whitespace found in content',
        inferred: true,
      },
    });
  });

  /*it('should handle nested curly braces', () => {
    const content = '{{ {{var} }}}';
    const result = extractVariablesFromContent({ content }, defaultOptions);
    expect(result).toEqual({
      nested: {
        type: 'string',
        description: 'Variable nested found in content',
        inferred: true,
      },
      var: {
        type: 'string',
        description: 'Variable var found in content',
        inferred: true,
      },
    });
  });*/

  it('should not modify existing input variables', () => {
    const content = '{{existingVar}} {{newVar}}';
    const templateVariable: TemplateVariable = {
      type: 'number',
      description: 'Existing variable',
      inferred: false,
    };
    const inputVariables = {
      existingVar: templateVariable,
    };
    const result = extractVariablesFromContent(
      { content, input_variables: inputVariables },
      defaultOptions,
    );
    expect(result).toEqual({
      existingVar: {
        type: 'number',
        description: 'Existing variable',
        inferred: false,
      },
      newVar: {
        type: 'string',
        description: 'Variable newVar found in content',
        inferred: true,
      },
    });
  });
});
