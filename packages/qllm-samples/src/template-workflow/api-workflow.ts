import { createLLMProvider, WorkflowManager, WorkflowDefinition } from "qllm-lib";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function main(): Promise<void> {
  console.log("\n🔍 Starting API Workflow Demo");

  // Create providers
  const providers = {
    openai: createLLMProvider({
      name: "openai",
      apiKey: process.env.OPENAI_API_KEY
    })
  };

  // Initialize workflow manager
  const workflowManager = new WorkflowManager(providers);

  try {
    // Define the workflow
    const workflowDefinition: WorkflowDefinition = {
      name: "api_analysis_workflow",
      description: "Fetch data from an API and analyze it using LLM",
      defaultProvider: "openai",
      steps: [
        {
          tool: "ApiServerCall",
          name: "test",
          description: "test create embed",
          input: {
            url: "http://localhost:8001/api/raglite/documents/upload_folder",
            method: "POST",
            data: JSON.stringify({
              repository: "{{repository}}"
            }),
            headers: JSON.stringify({
              "accept": "application/json",
              "Content-Type": "application/json"
            })
          },
          output: "status_code"
        },

      ]
    };

    // Register the workflow
    await workflowManager.loadWorkflow(workflowDefinition);
    console.log("\n✅ Workflow registered successfully");

    // Define workflow input variables
    const workflowInput = {
      userId: "1",
      generated_title: "Example API Workflow Post",
      generated_body: "This post was created through our API workflow",
      repository: "/tmp/s3_to_local/FRGTY"
    };

    // Execute workflow with progress tracking
    const result = await workflowManager.runWorkflow(
      "api_analysis_workflow",
      workflowInput,
      {
        onStepStart: (step, index) => {
          console.log(`\n🔍 Starting step ${index + 1}: ${step.name}`);
        },
        onStepComplete: (step, index, result) => {
          console.log(`\n✅ Completed step ${index + 1}: ${step.name}`);
          console.log(`Result:`, result);
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
    throw error;
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection:', reason);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error("\n💥 Fatal Error:", error);
    process.exit(1);
  });
}
