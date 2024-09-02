// Perplexity Sonar Models
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

// Perplexity Chat Models
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

// Open-Source Models
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

// All Perplexity Models
export const ALL_PERPLEXITY_MODELS = {
  ...PERPLEXITY_SONAR_MODELS,
  ...PERPLEXITY_CHAT_MODELS,
  ...PERPLEXITY_OPEN_SOURCE_MODELS,
};

// Default model
export const DEFAULT_PERPLEXITY_MODEL = PERPLEXITY_SONAR_MODELS.SONAR_SMALL_ONLINE.id;
