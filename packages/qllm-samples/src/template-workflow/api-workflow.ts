import { createLLMProvider, WorkflowManager } from "qllm-lib";
import dotenv from 'dotenv';

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

    // Load workflow from GitHub
    await workflowManager.loadWorkflow('https://raw.githubusercontent.com/YatchiYa/templates_prompts_qllm/main/workflows/efdefc0e-c759-49f1-90c8-1b9ecb199dc5/db3e4127-6a77-42ca-80cb-b9ef7f983ff3/fd-.yaml');
    console.log("\n✅ Workflow loaded successfully");

    // Define workflow input variables
    const workflowInput = {
      data: JSON.stringify({
        repository: "/tmp/s3_to_local/FRGTY"
      }),
      headers: JSON.stringify({
        "Content-Type": "application/json",
        "accept": "application/json"
      })
    };

    // Debug: Print workflow input
    console.log('\n🔍 Debug: Workflow input:', JSON.stringify(workflowInput, null, 2));

    console.log('\n🔍 Debug: Starting workflow execution...');
    const workflowResult = await workflowManager.runWorkflow(
      "fd ",
      workflowInput,
      {
        onStepStart: async (step: any, index: number) => {
          console.log('\n🔍 Debug - Starting step', index + 1);
          console.log('Step configuration:', JSON.stringify(step, null, 2));
        },
        onStepComplete: (step: any, index: number, stepResult: any) => {
          console.log(`\n✅ Step ${index + 1} completed`);
          console.log('Step result:', JSON.stringify(stepResult, null, 2));
        },
        onStreamChunk: (chunk: string) => {
          console.log('\n🔍 Debug - Stream chunk received:', chunk);
        },
        onToolExecution: (toolName: string, inputs: any) => {
          console.log('\n🔍 Debug - Tool execution:');
          console.log('Tool:', toolName);
          console.log('Inputs:', JSON.stringify(inputs, null, 2));
        }
      }
    );

    console.log("\n✅ Workflow execution completed");
    console.log('Final result:', JSON.stringify(workflowResult, null, 2));

  } catch (error) {
    console.error('\n❌ Error during workflow execution:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n🔍 Debug: Unhandled rejection:', reason);
  if (reason instanceof Error) {
    console.error('Error name:', reason.name);
    console.error('Error message:', reason.message);
    console.error('Stack trace:', reason.stack);
  }
  process.exit(1);
});

// Run the main function
main();
