/**
 * @fileoverview Custom API Server Call Tool
 * This module provides functionality to make HTTP requests to external APIs with custom input format.
 * @module custom-api-server-call
 */

import { BaseTool, ToolDefinition } from "./base-tool";
import axios, { AxiosRequestConfig, Method } from "axios";

/**
 * @class CustomApiServerCallTool
 * @extends BaseTool
 * @description A tool for making HTTP requests to external APIs with custom input format
 */
export class CustomApiServerCallTool extends BaseTool {
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
      name: 'customApiServerCall',
      description: 'Makes HTTP requests to external APIs with custom input format',
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
        repository: {
          type: 'string',
          required: true,
          description: 'Repository path'
        },
        query: {
          type: 'string',
          required: true,
          description: 'Query string'
        },
        headers: {
          type: 'string',
          required: false,
          description: 'Headers as JSON string'
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
    const { url, method, repository, query, headers } = inputs;

    try {
      // Create data object and stringify it
      const data = JSON.stringify({
        repository,
        query
      });

      // Parse headers from JSON string
      const parsedHeaders = typeof headers === 'string' ? JSON.parse(headers) : headers;

      const config: AxiosRequestConfig = {
        url,
        method: method as Method,
        headers: parsedHeaders,
        data
      };

      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API request failed: ${error.message}`);
      }
      throw error;
    }
  }
}
