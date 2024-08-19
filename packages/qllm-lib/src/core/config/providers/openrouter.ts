import { ProviderConfig } from '@qllm/types/src';

const openrouterConfig: ProviderConfig = {
  name: 'openrouter',
  models: [
    {
      alias: 'openai-gpt-4o',
      modelId: 'openai/gpt-4o-2024-08-06',
      parameters: {
        temperature: { type: 'float', min: 0, max: 1, default: 0.7 },
        top_p: { type: 'float', min: 0, max: 1, default: 1 },
        top_k: { type: 'integer', min: 1, max: 500, default: 250 },
        top_a: {
          type: 'float',
          min: 0,
          max: 1,
          default: 0,
          comment:
            'Consider only the top tokens with -sufficiently high- probabilities based on the probability of the most likely token. Think of it like a dynamic Top-P. A lower Top-A value focuses the choices based on the highest probability token but with a narrower scope. A higher Top-A value does not necessarily affect the creativity of the output, but rather refines the filtering process based on the maximum probability.',
        },
        min_p: {
          type: 'float',
          min: 0,
          max: 1,
          default: 0,
          comment:
            'Represents the minimum probability for a token to be considered, relative to the probability of the most likely token. (The value changes depending on the confidence level of the most probable token.) If your Min-P is set to 0.1, that means it will only allow for tokens that are at least 1/10th as probable as the best possible option',
        },
        frequency_penalty: {
          type: 'float',
          min: -2.0,
          max: 2.0,
          default: 0.0,
          comment:
            'This setting aims to control the repetition of tokens based on how often they appear in the input. It tries to use less frequently those tokens that appear more in the input, proportional to how frequently they occur. Token penalty scales with the number of occurrences. Negative values will encourage token reuse.',
        },
        presence_penalty: {
          type: 'float',
          min: -2.0,
          max: 2.0,
          default: 0.0,
          comment:
            'Adjusts how often the model repeats specific tokens already used in the input. Higher values make such repetition less likely, while negative values do the opposite. Token penalty does not scale with the number of occurrences. Negative values will encourage token reuse.',
        },
        repetition_penalty: {
          type: 'float',
          min: 0,
          max: 2.0,
          default: 1,
          comment:
            "Helps to reduce the repetition of tokens from the input. A higher value makes the model less likely to repeat tokens, but too high a value can make the output less coherent (often with run-on sentences that lack small words). Token penalty scales based on original token's probability.",
        },
        max_tokens: { type: 'integer', min: 1, max: 100000, default: 256 },
      },
    },
    {
      alias: 'mistral-nemo',
      modelId: 'nothingiisreal/mn-celeste-12b',
      parameters: {
        temperature: { type: 'float', min: 0, max: 1, default: 0.7 },
        top_p: { type: 'float', min: 0, max: 1, default: 1 },
        top_k: { type: 'integer', min: 1, max: 500, default: 250 },
        top_a: {
          type: 'float',
          min: 0,
          max: 1,
          default: 0,
          comment:
            'Consider only the top tokens with -sufficiently high- probabilities based on the probability of the most likely token. Think of it like a dynamic Top-P. A lower Top-A value focuses the choices based on the highest probability token but with a narrower scope. A higher Top-A value does not necessarily affect the creativity of the output, but rather refines the filtering process based on the maximum probability.',
        },
        min_p: {
          type: 'float',
          min: 0,
          max: 1,
          default: 0,
          comment:
            'Represents the minimum probability for a token to be considered, relative to the probability of the most likely token. (The value changes depending on the confidence level of the most probable token.) If your Min-P is set to 0.1, that means it will only allow for tokens that are at least 1/10th as probable as the best possible option',
        },
        frequency_penalty: {
          type: 'float',
          min: -2.0,
          max: 2.0,
          default: 0.0,
          comment:
            'This setting aims to control the repetition of tokens based on how often they appear in the input. It tries to use less frequently those tokens that appear more in the input, proportional to how frequently they occur. Token penalty scales with the number of occurrences. Negative values will encourage token reuse.',
        },
        presence_penalty: {
          type: 'float',
          min: -2.0,
          max: 2.0,
          default: 0.0,
          comment:
            'Adjusts how often the model repeats specific tokens already used in the input. Higher values make such repetition less likely, while negative values do the opposite. Token penalty does not scale with the number of occurrences. Negative values will encourage token reuse.',
        },
        repetition_penalty: {
          type: 'float',
          min: 0,
          max: 2.0,
          default: 1,
          comment:
            "Helps to reduce the repetition of tokens from the input. A higher value makes the model less likely to repeat tokens, but too high a value can make the output less coherent (often with run-on sentences that lack small words). Token penalty scales based on original token's probability.",
        },
        max_tokens: { type: 'integer', min: 1, max: 100000, default: 256 },
      },
    },
  ],
  defaultModel: 'mistral-nemo',
};

export default openrouterConfig;
