/**
 * @fileoverview Ollama model listing functionality for the QLLM library.
 * This module provides interfaces and functions to retrieve and format available models from an Ollama server.
 * 
 * @module providers/ollama
 * @version 1.0.0
 */

import axios from 'axios';
import { LLMProviderError } from '../../types';

/**
 * Represents the detailed specifications of an Ollama model.
 * @interface OllamaModelDetails
 */
interface OllamaModelDetails {
  /** Model format (e.g., gguf, ggml) */
  format: string;
  /** Base model family name */
  family: string;
  /** Array of related model families */
  families: string[] | null;
  /** Model size in billions of parameters */
  parameter_size: string;
  /** Level of model quantization applied */
  quantization_level: string;
}

/**
 * Represents a single model response from the Ollama API.
 * @interface OllamaModelResponse
 */
interface OllamaModelResponse {
  /** Model identifier */
  name: string;
  /** Last modification timestamp */
  modified_at: string;
  /** Model file size in bytes */
  size: number;
  /** Unique model digest */
  digest: string;
  /** Detailed model specifications */
  details: OllamaModelDetails;
}

/**
 * Represents the response structure from Ollama's list models API endpoint.
 * @interface OllamaListResponse
 */
interface OllamaListResponse {
  /** Array of available models */
  models: OllamaModelResponse[];
}

/**
 * Standardized model information structure used across the QLLM library.
 * @interface Model
 */
export interface Model {
  /** Unique model identifier */
  id: string;
  /** Model creation/modification timestamp */
  createdAt: string;
  /** Human-readable model description */
  description: string;
}

/**
 * Retrieves a list of available models from an Ollama server.
 * 
 * @param {string} baseUrl - Base URL of the Ollama server (defaults to http://localhost:11434)
 * @returns {Promise<Model[]>} Array of available models in standardized format
 * @throws {LLMProviderError} If the API request fails or returns invalid data
 * 
 * @example
 * // Get models from default local Ollama server
 * const models = await listModels();
 * 
 * @example
 * // Get models from custom Ollama server
 * const models = await listModels('http://custom-ollama:11434');
 */
export async function listModels(baseUrl: string = 'http://localhost:11434'): Promise<Model[]> {
  try {
    const response = await axios.get<OllamaListResponse>(`${baseUrl}/api/tags`);

    if (!response.data || !response.data.models || !Array.isArray(response.data.models)) {
      //console.warn('Unexpected response format from Ollama API');
      return [];
    }

    return response.data.models.map((model: OllamaModelResponse) => ({
      id: model.name,
      createdAt: model.modified_at,
      description: formatModelDescription(model.details),
    }));
  } catch (error) {
    //console.error('Error fetching models from Ollama:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new LLMProviderError(`Failed to fetch models from Ollama ${errorMessage}`, 'Ollama');
  }
}

/**
 * Formats model details into a human-readable description string.
 * 
 * @param {OllamaModelDetails} details - Raw model details from Ollama API
 * @returns {string} Formatted description string combining key model attributes
 * @private
 */
function formatModelDescription(details: OllamaModelDetails): string {
  const parts = [
    details.parameter_size,
    details.quantization_level,
    details.format.toUpperCase(),
    details.family,
  ];
  return parts.filter(Boolean).join(', ');
}
