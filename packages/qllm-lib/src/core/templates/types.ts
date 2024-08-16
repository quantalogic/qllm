// src/templates/types.ts

import { LLMProviderOptions } from '@qllm/types/src';  
import { ProviderName } from '@qllm/types/src';
import { LLMProvider } from '../providers/llm_provider';

/**
 * Represents a variable in a template.
 */
export interface TemplateVariable {
  /** The type of the variable. */
  type: 'string' | 'number' | 'boolean' | 'array';

  /** A description of the variable. */
  description: string;

  /** An optional default value for the variable. */
  default?: any;
}

/**
 * Represents the definition of a template.
 */
export interface TemplateDefinition {
  /** The name of the template. */
  name: string;

  /** The version of the template. */
  version: string;

  /** A description of the template. */
  description: string;

  /** The author of the template. */
  author: string;

  /** The provider to be used for this template. */
  provider: ProviderName;

  /** The model to be used for this template. */
  model: string;

  /** The input variables for the template. */
  input_variables: Record<string, TemplateVariable>;

  /** The output variables for the template. */
  output_variables?: Record<string, OutputVariable>;


  /** The content of the template. */
  content: string;

  /** Optional parameters for the template execution. */
  parameters?: {
    /** Maximum number of tokens to generate. */
    max_tokens?: number;

    /** Temperature for response generation. */
    temperature?: number;

    /** Top P for response generation. */
    top_p?: number;

    /** Top K for response generation. */
    top_k?: number;
  };

  /** Pre-resolved content with file inclusions processed. */
  resolved_content?: string;
}

/**
 * Represents the context for executing a template.
 */
export interface ExecutionContext {
  /** The template to be executed. */
  template: TemplateDefinition;

  /** The variables to be used in the template execution. */
  variables: Record<string, any>;

  /** Optional provider options for the execution. */
  providerOptions: LLMProviderOptions;

  /** The LLM provider instance to be used for execution. */
  provider: LLMProvider;

  /** Whether to stream the output. */
  stream?: boolean;
}

export interface OutputVariable {
  type: 'string' | 'integer' | 'float' | 'boolean' | 'array' | 'object';
  description?: string;
  default?: any;
}