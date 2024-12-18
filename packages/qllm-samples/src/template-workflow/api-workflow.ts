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
          name: "fetch_posts",
          description: "Fetch posts from JSONPlaceholder API",
          input: {
            url: "https://jsonplaceholder.typicode.com/posts",
            method: "GET"
          },
          output: "posts_data"
        },
        {
          tool: "ApiServerCall",
          name: "fetch_user",
          description: "Fetch specific user details",
          input: {
            url: "https://jsonplaceholder.typicode.com/users/{{userId}}",
            method: "GET"
          },
          output: "user_data"
        },
        {
          tool: "ApiServerCall",
          name: "create_post",
          description: "Create a new post",
          input: {
            url: "https://jsonplaceholder.typicode.com/posts",
            method: "POST",
            data: JSON.stringify({
              title: "{{generated_title}}",
              body: "{{generated_body}}",
              userId: "$user_data.id"
            })
          },
          output: "new_post"
        }
      ]
    };

    // Register the workflow
    await workflowManager.loadWorkflow(workflowDefinition);
    console.log("\n✅ Workflow registered successfully");

    // Define workflow input variables
    const workflowInput = {
      userId: "1",
      generated_title: "Example API Workflow Post",
      generated_body: "This post was created through our API workflow"
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
