/**
 * @fileoverview Tests for Variable Extraction Utility
 * 
 * This file contains comprehensive tests for the variable extraction functionality,
 * covering various notation styles and edge cases.
 */

import { extractVariablesFromContent } from '../extract-variable-from-content';
import { TemplateVariable } from '../../types';

describe('extractVariablesFromContent', () => {
  it('should extract simple variables', () => {
    const content = 'Hello {{name}}! Your age is {{age}}.';
    const result = extractVariablesFromContent({ content });

    expect(result).toEqual({
      name: {
        type: 'string',
        description: 'Automatically extracted variable: name',
      },
      age: {
        type: 'string',
        description: 'Automatically extracted variable: age',
      },
    });
  });

  it('should preserve existing variable definitions', () => {
    const content = 'Hello {{name}}! Your age is {{age}}.';
    const input_variables: Record<string, TemplateVariable> = {
      name: {
        type: 'string',
        description: 'User name',
        default: 'Guest',
      },
    };

    const result = extractVariablesFromContent({ content, input_variables });

    expect(result.name).toEqual(input_variables.name);
    expect(result.age).toEqual({
      type: 'string',
      description: 'Automatically extracted variable: age',
    });
  });

  it('should handle dot notation when enabled', () => {
    const content = 'Welcome {{user.name}}! Points: {{user.stats.points}}';
    const result = extractVariablesFromContent(
      { content },
      { allowDotNotation: true }
    );

    expect(result).toEqual({
      user: {
        type: 'string',
        description: 'Automatically extracted variable: user',
      },
    });
  });

  it('should handle bracket notation when enabled', () => {
    const content = 'Items: {{inventory["items"]}} Cost: {{prices[\'total\']}}';
    const result = extractVariablesFromContent(
      { content },
      { allowBracketNotation: true }
    );

    expect(result).toEqual({
      inventory: {
        type: 'string',
        description: 'Automatically extracted variable: inventory',
      },
      prices: {
        type: 'string',
        description: 'Automatically extracted variable: prices',
      },
    });
  });

  it('should handle function calls when enabled', () => {
    const content = 'Date: {{formatDate(date)}} Price: {{formatCurrency(price)}}';
    const result = extractVariablesFromContent(
      { content },
      { allowFunctionCalls: true }
    );

    expect(result).toEqual({
      formatDate: {
        type: 'string',
        description: 'Automatically extracted variable: formatDate',
      },
      formatCurrency: {
        type: 'string',
        description: 'Automatically extracted variable: formatCurrency',
      },
    });
  });

  it('should handle complex nested expressions', () => {
    const content = `
      Name: {{user.profile['name']}}
      Stats: {{user.stats.calculate(points).total}}
      Items: {{inventory['items'].filter(active).count}}
    `;
    const result = extractVariablesFromContent(
      { content },
      {
        allowDotNotation: true,
        allowBracketNotation: true,
        allowFunctionCalls: true,
      }
    );

    expect(result).toEqual({
      user: {
        type: 'string',
        description: 'Automatically extracted variable: user',
      },
      inventory: {
        type: 'string',
        description: 'Automatically extracted variable: inventory',
      },
    });
  });

  it('should handle edge cases and invalid syntax', () => {
    const content = `
      Valid: {{variable}}
      Unclosed: {{unclosed
      Empty: {{}}
      Invalid chars: {{$invalid#chars}}
      Nested: {{outer{{inner}}}}
    `;
    const result = extractVariablesFromContent({ content });

    expect(result).toEqual({
      variable: {
        type: 'string',
        description: 'Automatically extracted variable: variable',
      },
    });
  });
});
