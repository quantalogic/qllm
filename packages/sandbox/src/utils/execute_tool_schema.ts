import { Enclave } from '../core/enclave';
import { ToolSchema } from '../types';
import { z } from 'zod';

/**
 * Executes a single tool schema using the provided Enclave
 * @param {Enclave} enclave - The Enclave instance to use for execution
 * @param {ToolSchema<any>} schema - The tool schema to execute
 * @param {string} fileName - The name of the file containing the schema
 * @returns {Promise<void>}
 */
export async function executeToolSchema(enclave: Enclave, schema: ToolSchema<any>, fileName: string) {
    try {
      // Execute the AI tool with the given schema
      const result = await enclave.executeAITool(schema);
      
      // Log the result
      console.log(`\nResult for ${schema.tool}:`, JSON.stringify(result, null, 2));
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Handle Zod validation errors
        console.error(`Validation error for ${schema.tool} in ${fileName}:`, error.errors);
      } else {
        // Handle other types of errors
        console.error(`Error executing ${schema.tool} in ${fileName}:`, error);
      }
    }
  }