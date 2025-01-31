/**
 * @fileoverview OVH model configuration for the QLLM library.
 * Defines the DeepSeek-R1-Distill-Llama-70B model provided by OVH.
 */

export type OVHModelKey = 'DeepSeek-R1-Distill-Llama-70B';

export type OVHModelConfig = {
  id: string;
  name: string;
  parameterCount: string;
  contextLength: number;
  type: string;
  endpoint: string;
};

export const OVH_MODELS: Record<OVHModelKey, OVHModelConfig> = {
    "DeepSeek-R1-Distill-Llama-70B": {
      id: 'DeepSeek-R1-Distill-Llama-70B',
      name: 'DeepSeek R1 Distilled Llama 70B',
      parameterCount: '70B',
      contextLength: 64*1024, // Adjust based on actual model specs
      type: 'Chat Completion',
      endpoint: 'https://deepseek-r1-distill-llama-70b.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1',
    },
  };
  
export const ALL_OVH_MODELS: Record<OVHModelKey, OVHModelConfig> = {
    ...OVH_MODELS,
  };
  
export const DEFAULT_OVH_MODEL = "DeepSeek-R1-Distill-Llama-70B"