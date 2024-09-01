import { Enclave } from '../core/enclave';
import { ToolSchema, FileInput } from '../types';
import { executeToolSchema } from "./execute_tool_schema";

/**
 * Processes tool schemas from a given file input
 * @param {Enclave} enclave - The Enclave instance to use for execution
 * @param {FileInput} file - The file input containing tool schemas
 * @returns {Promise<void>}
 */
export async function processToolSchemas(enclave: Enclave, file: FileInput) {
    console.log(`Executing ${file.name}:`);
    let toolSchemas: ToolSchema<any> | ToolSchema<any>[];
  
    // Attempt to parse the file content as JSON
    try {
      toolSchemas = JSON.parse(file.content);
    } catch (error) {
      console.error(`Error parsing JSON in file ${file.name}:`, error);
      return;
    }
  
    // Process the parsed schemas
    if (Array.isArray(toolSchemas)) {
      // If it's an array of schemas, execute each one
      for (const schema of toolSchemas) {
        await executeToolSchema(enclave, schema, file.name);
      }
    } else if (typeof toolSchemas === 'object' && toolSchemas !== null) {
      // If it's a single schema object, execute it
      await executeToolSchema(enclave, toolSchemas, file.name);
    } else {
      // If it's neither an array nor an object, log an error
      console.error(`Invalid schema in file ${file.name}`);
    }
    console.log('---'); // Print a separator after processing each file
  }