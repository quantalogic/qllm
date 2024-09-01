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
  // Parse command-line arguments
  const argv = await parseArguments();
  
  // Get file inputs based on parsed arguments
  const fileInputs = await getFileInputs(argv);

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
    // Prepare the Enclave with file inputs
    // await enclave.prepare(fileInputs, []);

    // Process each input file
    for (const file of fileInputs) {
      await processToolSchemas(enclave, file);
    }
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