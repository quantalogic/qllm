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

const BASE_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_CONTEXT_LENGTH = 1024 * 32; // 32K tokens

const createGeminiModel = (
  id: GoogleModelKey,
  name: string,
  contextLength: number = DEFAULT_CONTEXT_LENGTH,
): GoogleModelConfig => ({
  id,
  name,
  parameterCount: '1T',
  contextLength,
  type: 'Chat Completion',
  endpoint: `${BASE_ENDPOINT}/${id}:generateContent`,
});

export const GOOGLE_MODELS: Record<GoogleModelKey, GoogleModelConfig> = {
  'gemini-1.5-pro': createGeminiModel(
    'gemini-1.5-pro',
    'Gemini 1.5 Pro',
    1024 * 1024, // 1M tokens
  ),
  'gemini-1.5-flash': createGeminiModel(
    'gemini-1.5-flash',
    'Gemini 1.5 Flash'
  ),
  'gemini-1.0-pro': createGeminiModel(
    'gemini-1.0-pro',
    'Gemini 1.0 Pro'
  ),
  'gemini-1.0-pro-vision': createGeminiModel(
    'gemini-1.0-pro-vision',
    'Gemini 1.0 Pro Vision'
  ),
};

export const ALL_GOOGLE_MODELS: Record<GoogleModelKey, GoogleModelConfig> = {
  ...GOOGLE_MODELS,
};

export const DEFAULT_GOOGLE_MODEL: GoogleModelKey = 'gemini-1.5-flash';
