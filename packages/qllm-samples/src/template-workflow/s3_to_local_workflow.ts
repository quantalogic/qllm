import { createLLMProvider, WorkflowManager } from "qllm-lib";
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

async function main(): Promise<void> {
  try {
    console.log("\n Debug - Starting S3 to local workflow execution");

    // Debug: Print relevant environment variables
    console.log('\n Debug: AWS Environment variables:');
    console.log('AWS_REGION:', process.env.AWS_S3_BUCKET_REGION);
    console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_S3_ACCESS_KEY ? ' Set' : ' Not set');
    console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_S3_SECRET_KEY ? ' Set' : ' Not set');

    // Validate AWS configuration
    if (!process.env.AWS_S3_ACCESS_KEY || !process.env.AWS_S3_SECRET_KEY || !process.env.AWS_S3_BUCKET_REGION) {
      throw new Error('Missing required AWS configuration in environment variables');
    }

    // Create providers
    const providers = {
      openai: createLLMProvider({
        name: "openai",
        apiKey: process.env.OPENAI_API_KEY
      })
    };

    // Initialize workflow manager
    const workflowManager = new WorkflowManager(providers);

    // Load workflow from local file
    const workflowPath = path.join(__dirname, 's3_to_local_workflow.yaml');
    console.log('\n Debug: Loading workflow from:', workflowPath);
    await workflowManager.loadWorkflow(workflowPath);
    console.log("\n Workflow loaded successfully");

    // Define workflow input variables
    const workflowInput = {
      // Pass keys directly as strings to avoid template substitution issues
      s3_bucket: process.env.AWS_S3_BUCKET_NAME!,
      s3_keys: "test/hello.py,test/greeting.ts",
      s3_separator : ",",
      template_content: "mystery",
      theme: "adventure",
      word_count: 700,
      target_audience: "young adults"
    };

    // Debug: Print workflow input
    console.log('\n Debug: Workflow input:', JSON.stringify(workflowInput, null, 2));

    console.log('\n Debug: Starting workflow execution...');
    const workflowResult = await workflowManager.runWorkflow(
      "s3_to_local",
      workflowInput,
      {
        onStepStart: async (step: any, index: number) => {
          console.log('\n Debug - Starting step', index + 1);
          console.log('Step configuration:', JSON.stringify(step, null, 2));
          console.log('Step input:', JSON.stringify(step.input, null, 2));
        },
        onStepComplete: (step: any, index: number, stepResult: any) => {
          console.log(`\n Step ${index + 1} completed`);
          console.log('Step result:', JSON.stringify(stepResult, null, 2));
        },
        onToolExecution: (toolName: string, inputs: any) => {
          console.log('\n Debug - Tool execution:');
          console.log('Tool:', toolName);
          console.log('Inputs:', JSON.stringify(inputs, null, 2));
        }
      }
    );

    console.log("\n Workflow execution completed");
    console.log('Final result:', JSON.stringify(workflowResult, null, 2));

  } catch (error) {
    console.error('\n Error during workflow execution:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

main().catch(console.error);