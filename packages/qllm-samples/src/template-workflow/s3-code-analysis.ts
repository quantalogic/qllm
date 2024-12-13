import { dot } from "node:test/reporters";
import { createLLMProvider, WorkflowManager, WorkflowDefinition, WorkflowStep, WorkflowExecutionResult } from "qllm-lib";
import dotenv from 'dotenv';
import path from 'path';
import { readFile } from 'fs/promises';
dotenv.config();

async function main(): Promise<void> {
  try {
    console.log("\n🔍 Debug - Starting workflow execution");

    // Create providers
    const providers = {
      openai: createLLMProvider({
        name: "openai",
        apiKey: process.env.OPENAI_API_KEY
      })
    };

    // Initialize workflow manager
    const workflowManager = new WorkflowManager(providers); 

    // Debug: Print environment variables
    console.log('🔍 Debug: Environment variables:');
    console.log('AWS_S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME);

    // Load workflow
    const workflowPath = path.join(__dirname, 's3-code-analysis.yaml');
    await workflowManager.loadWorkflow(workflowPath);
    console.log("\n✅ Workflow loaded successfully");

    // Define workflow input variables
    const workflowInput = {
      bucket_name: process.env.AWS_S3_BUCKET_NAME!,
      // Pass keys directly as strings to avoid template substitution issues
      load_key: "input/s3.tool.ts",
      save_key: "output/s3tool_analysis.txt",
      local_save_path: path.join(process.cwd(), 'result.txt')
    };

    // Debug: Print parameters
    console.log('🔍 Debug: Parameters:', JSON.stringify(workflowInput, null, 2));

    // Debug: Print S3 configuration
    console.log('\n🔍 Debug: S3 Configuration:');
    console.log('Bucket:', workflowInput.bucket_name);
    console.log('Load Key:', workflowInput.load_key);
    console.log('Save Key:', workflowInput.save_key);
    console.log('Local Save Path:', workflowInput.local_save_path);

    // Execute workflow with progress tracking
    console.log('🔍 Debug: Starting workflow execution...');

    const result = await workflowManager.runWorkflow(
      "s3_doc_analysis",
      workflowInput,
      {
        onStepStart: async (step: any, index: number) => {
          console.log('\n🔍 Starting step', index + 1, ':');
          console.log('Step:', JSON.stringify(step, null, 2));
          
          // Check both input and inputs
          const stepInputs = step.inputs || step.input;
          if (stepInputs) {
            console.log('🔍 Debug - Step Inputs:', typeof stepInputs, JSON.stringify(stepInputs, null, 2));
          }
        },
        onStepComplete: (step: WorkflowStep, index: number, result: WorkflowExecutionResult) => {
          console.log(`\n✅ Step ${index + 1} completed`);
          console.log('🔍 Debug - Step Result:', {
            type: typeof result,
            isNull: result === null,
            isUndefined: result === undefined,
            constructor: result?.constructor?.name,
            response: result?.response ? typeof result.response : 'N/A',
            outputVariables: result?.outputVariables ? Object.keys(result.outputVariables) : [],
          });
          if (result?.response) {
            console.log('🔍 Debug - Response Preview:', result.response.slice(0, 100));
          }
          if (result?.outputVariables) {
            console.log('🔍 Debug - Output Variables:', result.outputVariables);
          }
        },
        onStreamChunk: (chunk: string) => {
          process.stdout.write(chunk);
        }
      }
    );

    console.log("\n🎉 Workflow completed successfully");
    console.log("\nFinal Results:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("\n❌ Error:", error);
    // Debug: Print more error details
    if (error instanceof Error) {
      console.error('🔍 Debug: Error stack:', error.stack);
      console.error('🔍 Debug: Error name:', error.name);
      console.error('🔍 Debug: Error message:', error.message);
    }
    throw error;
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔍 Debug: Unhandled rejection:', reason);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  console.error("\n💥 Fatal Error:", error);
  process.exit(1);
});