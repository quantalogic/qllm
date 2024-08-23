import axios from 'axios';
import { LLMProviderError } from '../../types';

interface OllamaModelDetails {
  format: string;
  family: string;
  families: string[] | null;
  parameter_size: string;
  quantization_level: string;
}

interface OllamaModelResponse {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: OllamaModelDetails;
}

interface OllamaListResponse {
  models: OllamaModelResponse[];
}

export interface Model {
  id: string;
  createdAt: string;
  description: string;
}

export async function listModels(baseUrl: string = 'http://localhost:11434'): Promise<Model[]> {
  try {
    const response = await axios.get<OllamaListResponse>(`${baseUrl}/api/tags`);

    if (!response.data || !response.data.models || !Array.isArray(response.data.models)) {
      console.warn('Unexpected response format from Ollama API');
      return [];
    }

    return response.data.models.map((model: OllamaModelResponse) => ({
      id: model.name,
      createdAt: model.modified_at,
      description: formatModelDescription(model.details),
    }));
  } catch (error) {
    console.error('Error fetching models from Ollama:', error);
    throw new LLMProviderError('Failed to fetch models from Ollama', 'Ollama');
  }
}

function formatModelDescription(details: OllamaModelDetails): string {
  const parts = [
    details.parameter_size,
    details.quantization_level,
    details.format.toUpperCase(),
    details.family,
  ];
  return parts.filter(Boolean).join(', ');
}