/**
 * @fileoverview API Server Call Tool
 * This module provides functionality to make HTTP requests to external APIs.
 * @module api-server-call
 */

import { BaseTool, ToolDefinition } from "./base-tool";
import axios, { AxiosRequestConfig, Method } from "axios";

/**
 * @class ApiServerCallTool
 * @extends BaseTool
 * @description A tool for making HTTP requests to external APIs with configurable options.
 * 
 * @example
 * const apiCall = new ApiServerCallTool();
 * const result = await apiCall.execute({
 *   url: 'https://api.example.com/data',
 *   method: 'GET',
 *   token: 'Bearer xyz123',
 *   data: { query: 'example' }
 * });
 */
export class ApiServerCallTool extends BaseTool {
  /**
   * @constructor
   * @param {Record<string, any>} [config={}] - Tool configuration options
   */
  constructor(config: Record<string, any> = {}) {
    super(config);
  }

  /**
   * @method getDefinition
   * @returns {ToolDefinition} Tool definition object
   * @description Provides the tool's definition including input/output specifications
   */
  getDefinition(): ToolDefinition {
    return {
      name: 'apiServerCall',
      description: 'Makes HTTP requests to external APIs with configurable options',
      input: {
        url: {
          type: 'string',
          required: true,
          description: 'The URL to make the request to'
        },
        method: {
          type: 'string',
          required: true,
          description: 'HTTP method (GET, POST, PUT, DELETE, etc.)'
        },
        token: {
          type: 'string',
          required: false,
          description: 'Authorization token (if needed)'
        },
        data: {
          type: 'object',
          required: false,
          description: 'Request payload data (for POST, PUT, etc.)'
        },
        headers: {
          type: 'object',
          required: false,
          description: 'Additional headers to include in the request'
        }
      },
      output: {
        type: 'object',
        description: 'API response data'
      }
    };
  }

  /**
   * @method execute
   * @param {Record<string, any>} inputs - Input parameters for the API call
   * @returns {Promise<any>} API response data
   * @description Executes the API call with the provided parameters
   */
  async execute(inputs: Record<string, any>): Promise<any> {
    const { url, method, token, data, headers = {} } = inputs;

    try {
      const config: AxiosRequestConfig = {
        url,
        method: method as Method,
        headers: {
          ...headers,
          ...(token && { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` })
        },
        ...(data && { data })
      };

      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API call failed: ${error.message}`);
      }
      throw error;
    }
  }
}
