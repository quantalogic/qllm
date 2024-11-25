/**
 * @fileoverview Perplexity AI models configuration for the QLLM library.
 * This module defines the available models and their specifications for the Perplexity provider.
 * 
 * @module providers/perplexity/models
 * @version 1.0.0
 * 
 * @remarks
 * Perplexity AI offers several model categories:
 * - Sonar models: Online models with real-time information access
 * - Chat models: Optimized for conversational interactions
 * - Open-source models: Based on Meta's Llama 3.1 architecture
 * 
 * Each model is defined with:
 * - Unique identifier
 * - Display name
 * - Parameter count
 * - Context length
 * - Model type
 */

/** 
 * Perplexity Sonar Models - Online models with real-time information access
 * These models can access and process current information from the internet
 * 
 * @remarks
 * Available in three sizes:
 * - Small (8B parameters)
 * - Large (70B parameters)
 * - Huge (405B parameters)
 * All models support 128K context length
 */
export const PERPLEXITY_SONAR_MODELS = {
  SONAR_SMALL_ONLINE: {
    id: 'llama-3.1-sonar-small-128k-online',
    name: 'Llama 3.1 Sonar Small 128K (Online)',
    parameterCount: '8B',
    contextLength: 127072,
    type: 'Chat Completion',
  },
  SONAR_LARGE_ONLINE: {
    id: 'llama-3.1-sonar-large-128k-online',
    name: 'Llama 3.1 Sonar Large 128K (Online)',
    parameterCount: '70B',
    contextLength: 127072,
    type: 'Chat Completion',
  },
  SONAR_HUGE_ONLINE: {
    id: 'llama-3.1-sonar-huge-128k-online',
    name: 'Llama 3.1 Sonar Huge 128K (Online)',
    parameterCount: '405B',
    contextLength: 127072,
    type: 'Chat Completion',
  },
};

/** 
 * Perplexity Chat Models - Optimized for conversational interactions
 * These models are specifically tuned for natural dialogue and chat applications
 * 
 * @remarks
 * Available in two sizes:
 * - Small (8B parameters)
 * - Large (70B parameters)
 * All models support 128K context length
 */
export const PERPLEXITY_CHAT_MODELS = {
  SONAR_SMALL_CHAT: {
    id: 'llama-3.1-sonar-small-128k-chat',
    name: 'Llama 3.1 Sonar Small 128K (Chat)',
    parameterCount: '8B',
    contextLength: 131072,
    type: 'Chat Completion',
  },
  SONAR_LARGE_CHAT: {
    id: 'llama-3.1-sonar-large-128k-chat',
    name: 'Llama 3.1 Sonar Large 128K (Chat)',
    parameterCount: '70B',
    contextLength: 131072,
    type: 'Chat Completion',
  },
};

/** 
 * Open-Source Models - Based on Meta's Llama 3.1 architecture
 * These models are fine-tuned versions of Meta's Llama 3.1 for instruction following
 * 
 * @remarks
 * Available in two sizes:
 * - 8B parameters (faster, more efficient)
 * - 70B parameters (more capable, better reasoning)
 * All models support 128K context length
 */
export const PERPLEXITY_OPEN_SOURCE_MODELS = {
  LLAMA_8B_INSTRUCT: {
    id: 'llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    parameterCount: '8B',
    contextLength: 131072,
    type: 'Chat Completion',
  },
  LLAMA_70B_INSTRUCT: {
    id: 'llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B Instruct',
    parameterCount: '70B',
    contextLength: 131072,
    type: 'Chat Completion',
  },
};

/** 
 * Combined collection of all available Perplexity models
 * Includes Sonar, Chat, and Open-Source models in a single object
 * 
 * @example
 * ```typescript
 * // Access a specific model
 * const modelId = ALL_PERPLEXITY_MODELS.SONAR_SMALL_ONLINE.id;
 * 
 * // Get model details
 * const modelDetails = ALL_PERPLEXITY_MODELS.LLAMA_70B_INSTRUCT;
 * console.log(modelDetails.contextLength); // 131072
 * ```
 */
export const ALL_PERPLEXITY_MODELS = {
  ...PERPLEXITY_SONAR_MODELS,
  ...PERPLEXITY_CHAT_MODELS,
  ...PERPLEXITY_OPEN_SOURCE_MODELS,
};

/** 
 * Default model for Perplexity API requests
 * Currently set to Sonar Small Online for balanced performance and capabilities
 * 
 * @remarks
 * This model offers:
 * - 8B parameters for efficient processing
 * - 128K context length
 * - Real-time information access
 * - Good balance of speed and capability
 */
export const DEFAULT_PERPLEXITY_MODEL = PERPLEXITY_SONAR_MODELS.SONAR_SMALL_ONLINE.id;
