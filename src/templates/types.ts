// src/templates/types.ts

import { LLMProviderOptions } from '../providers/types';

export interface TemplateVariable {
    type: 'string' | 'number' | 'boolean' | 'array';
    description: string;
    default?: any;
  }
  
  export interface TemplateDefinition {
    name: string;
    version: string;
    description: string;
    author: string;
    provider: string;
    model: string;
    input_variables: Record<string, TemplateVariable>;
    output_variables: Record<string, TemplateVariable>;
    content: string;
    parameters?: {
      max_tokens?: number;
      temperature?: number;
      top_p?: number;
      top_k?: number;
    };
  }
  


  export interface ExecutionContext {
    template: TemplateDefinition;
    variables: Record<string, any>;
    providerOptions?: LLMProviderOptions; // Add this line
  }