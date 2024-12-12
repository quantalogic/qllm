import { createLLMProvider, WorkflowManager } from "qllm-lib";
import path from 'path';
// import dotenv from 'dotenv';
// dotenv.config();

async function main(): Promise<void> {
  try {
    console.log("\n🔍 Debug - Starting workflow execution");

    // Debug: Print ALL environment variables
    console.log('\n🔍 Debug: ALL Environment variables:');
    // console.log(process.env);

    // // Debug: Print specific Jira variables
    // console.log('\n🔍 Debug: Jira Environment variables:');
    // console.log('JIRA_HOST:', process.env.JIRA_HOST);
    // console.log('JIRA_MAIL:', process.env.JIRA_MAIL);
    // console.log('JIRA_TOKEN:', process.env.JIRA_TOKEN);

    // // Validate configuration
    // if (!process.env.JIRA_HOST || !process.env.JIRA_MAIL || !process.env.JIRA_TOKEN) {
    //   throw new Error('Missing required Jira configuration in environment variables');
    // }

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
    // const workflowPath = path.join(__dirname, 'jira-workflow.yaml');
    // console.log('\n🔍 Debug: Loading workflow from:', workflowPath);
    // await workflowManager.loadWorkflow(workflowPath);
    await workflowManager.loadWorkflow('https://raw.githubusercontent.com/jluongg/templates_prompts_qllm/refs/heads/main/jira-simple-bis.yaml');
    console.log("\n✅ Workflow loaded successfully");

    // Define workflow input variables
    const workflowInput = {
      projectKey: "QUAN",
      summary: "Test Ticket Creation",
      description: "This is a test ticket to verify the Jira integration",
      issueType: "Task",
      storyPoints: 1
    };

    // Debug: Print FULL parameters including sensitive data
    console.log('\n🔍 Debug: FULL Parameters (including sensitive):', JSON.stringify(workflowInput, null, 2));

    console.log('\n🔍 Debug: Starting workflow execution...');
    const workflowResult = await workflowManager.runWorkflow(
      "jira_simple",
      workflowInput,
      {
        onStepStart: async (step: any, index: number) => {
          console.log('\n🔍 Debug - Starting step', index + 1);
          console.log('Full step configuration:', JSON.stringify(step, null, 2));
          console.log('Step input:', JSON.stringify(step.input, null, 2));
          if (step.input.config) {
            console.log('Config section:', JSON.stringify(step.input.config, null, 2));
            console.log('Token in config:', step.input.config.token);
          }
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
          console.log('Full inputs:', JSON.stringify(inputs, null, 2));
          if (inputs.config) {
            console.log('Config section:', JSON.stringify(inputs.config, null, 2));
            console.log('Token in config:', inputs.config.token);
          }
        }
      }
    );

    console.log("\n✅ Workflow execution completed");
    console.log('Final result:', JSON.stringify(workflowResult, null, 2));

  } catch (error) {
    console.error('\n❌ Error during workflow execution:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
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
  console.error('Full rejection object:', JSON.stringify(reason, null, 2));
  if (reason instanceof Error) {
    console.error('Error name:', reason.name);
    console.error('Error message:', reason.message);
    console.error('Stack trace:', reason.stack);
  }
  process.exit(1);
});

// Run the main function
main();
