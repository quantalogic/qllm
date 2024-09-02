// Import necessary modules and components
import { Enclave } from './core/enclave';
import { TextSummerize } from './ai-tools/text-summerize';
import { CodeGenerator } from './ai-tools/code-generator';
import dotenv from 'dotenv';
import { getFileInputs } from "./utils/tools";
import { parseArguments } from "./utils/parse_argument"
import { processToolSchemas } from "./utils/process_tool_schema"

// Load environment variables from .env file
dotenv.config();

/**
 * Main function to execute the sandbox environment
 * @async
 */
async function executeSandbox() {
  
  // Get file inputs based on parsed arguments 
  // Initialize the Enclave with configuration
  const enclave = new Enclave({
    cacheDir: './cache',  // Directory for caching
    sandboxConfig: { rootDir: './sandbox' },  // Sandbox root directory
    resourceLimits: {
      maxExecutionTime: 5000,  // Maximum execution time in milliseconds
      maxMemory: 100 * 1024 * 1024  // Maximum memory usage in bytes (100 MB)
    },
    loggerConfig: { debugMode: true }  // Enable debug logging
  });

  // Register AI tools with the Enclave
  enclave.registerAITool(TextSummerize);
  enclave.registerAITool(CodeGenerator);

  try {
    // Execute the AI tool with the given schema
    const schema = {
        "tool": "text-summerizer",
        "params": {
          "file_url": "https://www.quantalogic.app/blogs/introduction",
          "max_words": 150
        }
      }
    const result = await enclave.executeAITool(schema);
    // Log the result
    console.log(`\nResult for ${schema.tool}:`, JSON.stringify(result, null, 2));


    // Execute the AI tool with the given schema
    const schema_2 = {
        "tool": "python-code-generator",
        "params": {
          "language": "Python",
          "task_description": "🐍 Generate a snake game",
          "requirements": "🍎 The game should have a snake that moves around the screen and eats food"
        }
      }
    const result_2 = await enclave.executeAITool(schema_2);
    // Log the result_2
    console.log(`\nResult_2 for ${schema.tool}:`, JSON.stringify(result_2, null, 2));

  } catch (error) {
    // Log any errors that occur during execution
    console.error('Execution failed:', error);
  } finally {
    // Ensure cleanup of Enclave resources, regardless of success or failure
    await enclave.cleanup();
  } 
}

// Execute the sandbox and catch any unhandled errors
executeSandbox().catch(console.error);