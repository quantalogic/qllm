// template.test.ts

import { Template } from '../template';
import {
  TemplateDefinition,
  InputValidationError,
  TemplateVariable,
  OutputVariable,
} from '../types';
import axios from 'axios';
import fs from 'fs/promises';
import yaml from 'js-yaml';

jest.mock('axios');
jest.mock('fs/promises');
jest.mock('js-yaml');

describe('Template', () => {
  const mockTemplateDefinition: TemplateDefinition = {
    name: 'Test Template',
    version: '1.0.0',
    description: 'A test template',
    author: 'Test Author',
    provider: 'Test Provider',
    model: 'Test Model',
    input_variables: {
      name: { type: 'string', description: 'Name variable' },
      age: { type: 'number', description: 'Age variable' },
      isActive: { type: 'boolean', description: 'Active status' },
      tags: { type: 'array', description: 'Tags' },
    },
    output_variables: {
      result: { type: 'string', description: 'Result of the template' },
    },
    content:
      'Hello {{name}}, you are {{age}} years old. Active: {{isActive}}. Tags: {{tags}}. {{undeclared}}',
    parameters: {
      max_tokens: 100,
      temperature: 0.7,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create a Template instance with given definition', () => {
      const template = new Template(mockTemplateDefinition);
      expect(template).toBeInstanceOf(Template);
      expect(template.name).toBe(mockTemplateDefinition.name);
      expect(template.version).toBe(mockTemplateDefinition.version);
      expect(template.description).toBe(mockTemplateDefinition.description);
      expect(template.author).toBe(mockTemplateDefinition.author);
      expect(template.provider).toBe(mockTemplateDefinition.provider);
      expect(template.model).toBe(mockTemplateDefinition.model);
      expect(template.content).toBe(mockTemplateDefinition.content);
      expect(template.parameters).toEqual(mockTemplateDefinition.parameters);
    });

    it('should extract variables from content', () => {
      const template = new Template(mockTemplateDefinition);
      expect(template.input_variables).toHaveProperty('name');
      expect(template.input_variables).toHaveProperty('age');
      expect(template.input_variables).toHaveProperty('isActive');
      expect(template.input_variables).toHaveProperty('tags');
      expect(template.input_variables).toHaveProperty('undeclared');
    });

    it('should not override existing variable definitions', () => {
      const template = new Template(mockTemplateDefinition);
      expect(template.input_variables.name).toEqual(mockTemplateDefinition.input_variables?.name);
      expect(template.input_variables.undeclared).toEqual({
        type: 'string',
        description: 'Variable undeclared found in content',
        inferred: true,
      });
    });
  });

  describe('fromUrl', () => {
    it('should create a Template instance from a URL', async () => {
      const mockYamlContent = 'mockYamlContent';
      (axios.get as jest.Mock).mockResolvedValue({ data: mockYamlContent });
      (yaml.load as jest.Mock).mockReturnValue(mockTemplateDefinition);

      const template = await Template.fromUrl('http://example.com/template.yaml');
      expect(template).toBeInstanceOf(Template);
      expect(axios.get).toHaveBeenCalledWith('http://example.com/template.yaml');
      expect(yaml.load).toHaveBeenCalledWith(mockYamlContent);
    });

    it('should throw an InputValidationError if fetching fails', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));
      await expect(Template.fromUrl('http://example.com/template.yaml')).rejects.toThrow(
        InputValidationError,
      );
    });
  });

  describe('fromPath', () => {
    it('should create a Template instance from a file path', async () => {
      const mockYamlContent = 'mockYamlContent';
      (fs.readFile as jest.Mock).mockResolvedValue(mockYamlContent);
      (yaml.load as jest.Mock).mockReturnValue(mockTemplateDefinition);

      const template = await Template.fromPath('/path/to/template.yaml');
      expect(template).toBeInstanceOf(Template);
      expect(fs.readFile).toHaveBeenCalledWith('/path/to/template.yaml', 'utf-8');
      expect(yaml.load).toHaveBeenCalledWith(mockYamlContent);
    });

    it('should throw an InputValidationError if reading file fails', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
      await expect(Template.fromPath('/path/to/template.yaml')).rejects.toThrow(
        InputValidationError,
      );
    });
  });

  describe('fromYaml', () => {
    it('should create a Template instance from YAML content', () => {
      (yaml.load as jest.Mock).mockReturnValue(mockTemplateDefinition);
      const template = Template.fromYaml('yaml content');
      expect(template).toBeInstanceOf(Template);
      expect(yaml.load).toHaveBeenCalledWith('yaml content');
    });

    it('should throw an InputValidationError if YAML is invalid', () => {
      (yaml.load as jest.Mock).mockReturnValue(null);
      expect(() => Template.fromYaml('invalid yaml')).toThrow(InputValidationError);
    });
  });

  describe('setResolvedContent', () => {
    it('should set the resolved content', () => {
      const template = new Template(mockTemplateDefinition);
      template.setResolvedContent('Resolved content');
      expect(template.resolved_content).toBe('Resolved content');
    });
  });

  describe('toYaml', () => {
    it('should return the template as YAML', () => {
      const template = new Template(mockTemplateDefinition);
      (yaml.dump as jest.Mock).mockReturnValue('yaml output');
      expect(template.toYaml()).toBe('yaml output');
      expect(yaml.dump).toHaveBeenCalledWith(template);
    });
  });

  describe('parseVariables', () => {
    let template: Template;

    beforeEach(() => {
      template = new Template(mockTemplateDefinition);
    });

    it('should parse string variables correctly', () => {
      const args = ['-v:name', 'John'];
      const variables = template.parseVariables(args);
      expect(variables).toEqual({ name: 'John' });
    });

    it('should parse number variables correctly', () => {
      const args = ['-v:age', '30'];
      const variables = template.parseVariables(args);
      expect(variables).toEqual({ age: 30 });
    });

    it('should parse boolean variables correctly', () => {
      const args = ['-v:isActive', 'true'];
      const variables = template.parseVariables(args);
      expect(variables).toEqual({ isActive: true });
    });

    it('should parse array variables correctly', () => {
      const args = ['-v:tags', '["tag1","tag2"]'];
      const variables = template.parseVariables(args);
      expect(variables).toEqual({ tags: ['tag1', 'tag2'] });
    });

    it('should parse array variables as comma-separated strings', () => {
      const args = ['-v:tags', 'tag1,tag2'];
      const variables = template.parseVariables(args);
      expect(variables).toEqual({ tags: ['tag1', 'tag2'] });
    });

    it('should handle multiple variables', () => {
      const args = [
        '-v:name',
        'John',
        '-v:age',
        '30',
        '-v:isActive',
        'true',
        '-v:tags',
        '["tag1","tag2"]',
      ];
      const variables = template.parseVariables(args);
      expect(variables).toEqual({
        name: 'John',
        age: 30,
        isActive: true,
        tags: ['tag1', 'tag2'],
      });
    });

    it('should throw an InputValidationError for invalid number', () => {
      const args = ['-v:age', 'not-a-number'];
      expect(() => template.parseVariables(args)).toThrow(InputValidationError);
    });

    it('should throw an InputValidationError for invalid boolean', () => {
      const args = ['-v:isActive', 'not-a-boolean'];
      expect(() => template.parseVariables(args)).toThrow(InputValidationError);
    });

    it('should handle undeclared variables as strings', () => {
      const args = ['-v:undeclared', 'some value'];
      const variables = template.parseVariables(args);
      expect(variables).toEqual({ undeclared: 'some value' });
    });
  });

  describe('toObject', () => {
    it('should return the template as an object', () => {
      const template = new Template(mockTemplateDefinition);
      const obj = template.toObject();
      expect(obj).toEqual(expect.objectContaining(mockTemplateDefinition));
    });

    it('should include undeclared variables in the output object', () => {
      const template = new Template(mockTemplateDefinition);
      const obj = template.toObject();
      expect(obj.input_variables).toHaveProperty('undeclared');
    });
  });

  describe('Template Tests', () => {
    let templateWithDuplicates: TemplateDefinition;

    beforeEach(() => {
      // Reset the template definition before each test
      templateWithDuplicates = {
        ...mockTemplateDefinition,
        content:
          'Hello {{name}}, {{name}}! Your age is {{age}} and your city is {{city}}. {{city}} is nice!',
      };
    });

    it('should extract all variables from content, including duplicates', () => {
      const template = new Template(templateWithDuplicates);
      expect(template.input_variables).toHaveProperty('name');
      expect(template.input_variables).toHaveProperty('age');
      expect(template.input_variables).toHaveProperty('city');
      expect(Object.keys(template.input_variables)).toHaveLength(5); // 4 original + 1 new (city)
    });
  });

  /*it('should handle complex nested structures in content', () => {
    const complexTemplate: TemplateDefinition = {
      ...mockTemplateDefinition,
      content:
        'Nested: {{ outer.{{ inner }} }}. Array: {{ array[0] }}. Function: {{ func("arg") }}.',
    };
    const template = new Template(complexTemplate);
    expect(template.input_variables).toHaveProperty('outer');
    expect(template.input_variables).toHaveProperty('inner');
    expect(template.input_variables).toHaveProperty('array');
    expect(template.input_variables).toHaveProperty('func');
  });*/
});

describe('Error Handling', () => {
  it('should throw an InputValidationError for invalid template structure', () => {
    (yaml.load as jest.Mock).mockReturnValue('not an object');
    expect(() => Template.fromYaml('invalid yaml')).toThrow(InputValidationError);
  });
});
