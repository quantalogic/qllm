/**
 * @fileoverview Google model configuration for the QLLM library.
 * Defines the available Gemini models provided by Google.
 */

export type GoogleModelKey = 
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'gemini-1.0-pro'
  | 'gemini-1.0-pro-vision';

export type GoogleModelConfig = {
  id: string;
  name: string;
  parameterCount: string;
  contextLength: number;
  type: string;
  endpoint: string;
};

export const GOOGLE_MODELS: Record<GoogleModelKey, GoogleModelConfig> = {
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    parameterCount: '1T',
    contextLength: 1024 * 1024, // 1M tokens
    type: 'Chat Completion',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
  },
  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    parameterCount: '1T',
    contextLength: 1024 * 32, // 32K tokens
    type: 'Chat Completion',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  },
  'gemini-1.0-pro': {
    id: 'gemini-1.0-pro',
    name: 'Gemini 1.0 Pro',
    parameterCount: '1T',
    contextLength: 1024 * 32, // 32K tokens
    type: 'Chat Completion',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent',
  },
  'gemini-1.0-pro-vision': {
    id: 'gemini-1.0-pro-vision',
    name: 'Gemini 1.0 Pro Vision',
    parameterCount: '1T',
    contextLength: 1024 * 32, // 32K tokens
    type: 'Chat Completion',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro-vision:generateContent',
  },
};

export const ALL_GOOGLE_MODELS: Record<GoogleModelKey, GoogleModelConfig> = {
  ...GOOGLE_MODELS,
};

export const DEFAULT_GOOGLE_MODEL: GoogleModelKey = 'gemini-1.5-flash';
