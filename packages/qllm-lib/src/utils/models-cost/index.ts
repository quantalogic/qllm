import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import logger from '../logger/index.js';
import { TokenPrices, TokenResult, TokenCalculateInput, TokenCalculateOutput, TokenCountResult } from "../../types"


export class TokenController {

  static async calculateInput(params: Pick<TokenCalculateInput, 'input_text' | 'provider' | 'model'>): Promise<TokenCountResult> {
    
    const tiktoken = await import('tiktoken');
    if (!params.input_text) {
      throw new Error("Input text is required");
    }

    try {
      const encoding = tiktoken.encoding_for_model("gpt-3.5-turbo");
      const inputTokens = encoding.encode(params.input_text).length;

      const priceFile = path.join('.', 'data', 'token_price.json');
      const data = await fs.readFile(priceFile, 'utf-8');
      const tokenPrices: TokenPrices = JSON.parse(data);
      const results: TokenResult[] = [];

      for (const providerData of tokenPrices.providers) {
        if (params.provider && providerData.name.toLowerCase() !== params.provider.toLowerCase()) {
          continue;
        }

        for (const modelData of providerData.models) {
          if (params.model && modelData.name.toLowerCase() !== params.model.toLowerCase()) {
            continue;
          }

          const inputPrice = (inputTokens / 1000) * modelData.input_price;

          results.push({
            provider: providerData.name,
            model: modelData.name,
            input_tokens: inputTokens,
            output_tokens: 0,
            total_tokens: inputTokens,
            input_price: inputPrice,
            output_price: 0,
            total_price: inputPrice
          });
        }
      }

      encoding.free();

      return {
        tokens: inputTokens,
        prices: results
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  // Calculate only output tokens
  static async calculateOutput(params: Pick<TokenCalculateInput, 'output_text' | 'provider' | 'model'>): Promise<TokenCountResult> {
    
    const tiktoken = await import('tiktoken');
    if (!params.output_text) {
      throw new Error("Output text is required");
    }

    try {
      const encoding = tiktoken.encoding_for_model("gpt-3.5-turbo");
      const outputTokens = encoding.encode(params.output_text).length;

      const priceFile = path.join('.', 'data', 'token_price.json');
      const data = await fs.readFile(priceFile, 'utf-8');
      const tokenPrices: TokenPrices = JSON.parse(data);
      const results: TokenResult[] = [];

      for (const providerData of tokenPrices.providers) {
        if (params.provider && providerData.name.toLowerCase() !== params.provider.toLowerCase()) {
          continue;
        }

        for (const modelData of providerData.models) {
          if (params.model && modelData.name.toLowerCase() !== params.model.toLowerCase()) {
            continue;
          }

          const outputPrice = (outputTokens / 1000) * modelData.output_price;

          results.push({
            provider: providerData.name,
            model: modelData.name,
            input_tokens: 0,
            output_tokens: outputTokens,
            total_tokens: outputTokens,
            input_price: 0,
            output_price: outputPrice,
            total_price: outputPrice
          });
        }
      }

      encoding.free();

      return {
        tokens: outputTokens,
        prices: results
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }


  static async calculate(params: TokenCalculateInput): Promise<TokenCalculateOutput> {
    
    const tiktoken = await import('tiktoken');
    const { input_text, output_text, provider, model } = params;

    if (!input_text && !output_text) {
      throw new Error("At least one of input_text or output_text is required");
    }

    try {
      const encoding = tiktoken.encoding_for_model("gpt-3.5-turbo");
      const inputTokens = input_text ? encoding.encode(input_text).length : 0;
      const outputTokens = output_text ? encoding.encode(output_text).length : 0;
      const totalTokens = inputTokens + outputTokens;

      const priceFile = path.join('.', 'data', 'token_price.json');
      let data: string;
      try {
        data = await fs.readFile(priceFile, 'utf-8');
      } catch (error) {
        throw new Error("Error reading price file");
      }

      const tokenPrices: TokenPrices = JSON.parse(data);
      const results: TokenResult[] = [];

      for (const providerData of tokenPrices.providers) {
        if (provider && providerData.name.toLowerCase() !== provider.toLowerCase()) {
          continue;
        }

        for (const modelData of providerData.models) {
          if (model && modelData.name.toLowerCase() !== model.toLowerCase()) {
            continue;
          }

          const inputPrice = (inputTokens / 1000) * modelData.input_price;
          const outputPrice = (outputTokens / 1000) * modelData.output_price;
          const totalPrice = inputPrice + outputPrice;

          const tokenResult: TokenResult = {
            provider: providerData.name,
            model: modelData.name,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            total_tokens: inputTokens + outputTokens,
            input_price: inputPrice,
            output_price: outputPrice,
            total_price: totalPrice
          };

          results.push(tokenResult);
        }
      }

      encoding.free();

      return {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
        prices: results
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
}
