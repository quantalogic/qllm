/**
 * @fileoverview Type definitions for model cost calculation in the QLLM library.
 * This file defines types for tracking and calculating token usage and associated costs
 * across different language models and providers.
 * 
 * @version 1.0.0
 * @license MIT
 */

/**
 * Represents the token usage and cost calculation result for a single operation
 */
export interface TokenResult {
  /** Name of the provider (e.g., 'OpenAI', 'Anthropic') */
  provider: string;
  /** Model identifier */
  model: string;
  /** Number of tokens in the input */
  input_tokens: number;
  /** Number of tokens in the output */
  output_tokens: number;
  /** Total number of tokens used */
  total_tokens: number;
  /** Cost for input tokens */
  input_price: number;
  /** Cost for output tokens */
  output_price: number;
  /** Total cost for the operation */
  total_price: number;
}

/**
 * Defines pricing information for a specific model
 */
export interface PriceModel {
  /** Model identifier */
  name: string;
  /** Cost per input token */
  input_price: number;
  /** Cost per output token */
  output_price: number;
}

/**
 * Groups models under a provider with their pricing information
 */
export interface Provider {
  /** Provider name */
  name: string;
  /** Array of models with their pricing */
  models: PriceModel[];
}

/**
 * Collection of provider-specific token pricing information
 */
export interface TokenPrices {
  /** Array of providers with their model pricing */
  providers: Provider[];
}

/**
 * Input parameters for token calculation
 */
export interface TokenCalculateInput {
  /** Text to calculate tokens for input */
  input_text?: string;
  /** Text to calculate tokens for output */
  output_text?: string;
  /** Specific provider to calculate for */
  provider?: string;
  /** Specific model to calculate for */
  model?: string;
}

/**
 * Result of token calculation including costs across providers
 */
export interface TokenCalculateOutput {
  /** Number of tokens in the input */
  input_tokens: number;
  /** Number of tokens in the output */
  output_tokens: number;
  /** Total number of tokens */
  total_tokens: number;
  /** Array of price calculations per provider/model */
  prices: TokenResult[];
}

/**
 * Result of token counting operation
 */
export interface TokenCountResult {
  /** Number of tokens counted */
  tokens: number;
  /** Array of price calculations per provider/model */
  prices: TokenResult[];
}