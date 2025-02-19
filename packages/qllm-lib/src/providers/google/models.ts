/**
 * @fileoverview Google model configuration for the QLLM library.
 * Defines the available Gemini models provided by Google.
 */

export type GoogleModelKey = 
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'gemini-1.0-pro'
  | 'gemini-1.0-pro-vision'
  | 'gemini-2.0-flash'
  ;

export type GoogleModelConfig = {
  id: string;
  name: string;
  parameterCount: string;
  contextLength: number;
  type: string;
  endpoint: string;
};

export type GoogleModelResponse = {
  models: Array<{
    name: string;
    version: string;
    displayName: string;
    description: string;
    inputTokenLimit: number;
    outputTokenLimit: number;
    supportedGenerationMethods: string[];
    temperature: { minValue: number; maxValue: number };
    topP: { minValue: number; maxValue: number };
    topK: { minValue: number; maxValue: number };
  }>;
};

const BASE_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta';
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
  endpoint: `${BASE_ENDPOINT}/models/${id}:generateContent`,
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
  'gemini-2.0-flash': createGeminiModel(
    'gemini-2.0-flash',
    'Gemini 2.0 Flash'
  ),
};

export const ALL_GOOGLE_MODELS: Record<GoogleModelKey, GoogleModelConfig> = {
  ...GOOGLE_MODELS,
};

export const DEFAULT_GOOGLE_MODEL: GoogleModelKey = 'gemini-2.0-flash';

/**
 * Fetches available models from Google AI API and merges them with existing models
 * @param apiKey - Google API key for authentication
 * @returns Promise<Record<GoogleModelKey, GoogleModelConfig>>
 */
export async function fetchGoogleModels(apiKey: string): Promise<Record<GoogleModelKey, GoogleModelConfig>> {
  try {
    const response = await fetch(`${BASE_ENDPOINT}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch models from Google API, using default models');
      return ALL_GOOGLE_MODELS;
    }

    const data = await response.json() as GoogleModelResponse;
    const dynamicModels = { ...ALL_GOOGLE_MODELS };

    // Only add models that support generateContent and match our existing model pattern
    for (const model of data.models) {
      const modelId = model.name.split('/').pop() as string;
      if (modelId && 
          model.supportedGenerationMethods.includes('generateContent') && 
          modelId.startsWith('gemini-')) {
        dynamicModels[modelId as GoogleModelKey] = {
          id: modelId,
          name: model.displayName || modelId,
          parameterCount: 'Unknown',
          contextLength: model.inputTokenLimit || DEFAULT_CONTEXT_LENGTH,
          type: 'Chat Completion',
          endpoint: `${BASE_ENDPOINT}/models/${modelId}:generateContent`,
        };
      }
    }

    return dynamicModels;
  } catch (error) {
    console.warn('Failed to fetch Google models, using default models:', error);
    return ALL_GOOGLE_MODELS;
  }
}
