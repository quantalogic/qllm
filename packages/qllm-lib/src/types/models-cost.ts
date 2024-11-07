
export interface TokenResult {
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_price: number;
  output_price: number;
  total_price: number;
}

export interface PriceModel {
  name: string;
  input_price: number;
  output_price: number;
}

export interface Provider {
  name: string;
  models: PriceModel[];
}

export interface TokenPrices {
  providers: Provider[];
}

export interface TokenCalculateInput {
  input_text?: string;
  output_text?: string;
  provider?: string;
  model?: string;
}

export interface TokenCalculateOutput {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  prices: TokenResult[];
}

export interface TokenCountResult {
  tokens: number;
  prices: TokenResult[];
}