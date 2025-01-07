import { createLLMProvider, WorkflowManager, WorkflowDefinition, TemplateLoaderConfig } from "qllm-lib";

const token = "token"

async function main(): Promise<void> {
  console.log("\n Debug - Starting workflow execution");

  // Validate required environment variables
  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  // Create providers
  const providers = {
    openai: createLLMProvider({
      name: "openai",
      apiKey: process.env.OPENAI_API_KEY
    })
  };

  // Configure authentication for private repositories
  const authConfig: TemplateLoaderConfig = {
    githubToken: token,
    auth: {
      type: 'bearer',
      token: token
    },
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3.raw'
    }
  };

  // Initialize workflow manager with authentication
  const workflowManager = new WorkflowManager(providers, undefined, authConfig);

  try {
    // Load workflow from private repository
    await workflowManager.loadWorkflow('https://raw.githubusercontent.com/YatchiYa/templates_prompts_qllm/main/workflow.yaml');
    console.log("\n Workflow loaded successfully");

    // Define workflow input variables
    const workflowInput = {
      genre: "science fiction",
      theme: "space exploration",
      word_count: "1000",
      target_audience: "young adults",
      visual_style: "cinematic",
      atmospheric_mood: "mysterious"
    };

    // Execute workflow with progress tracking
    const result = await workflowManager.runWorkflow(
      "story_visualization_workflow",
      workflowInput,
      {
        onStepStart: (step, index) => {
          console.log(`\n Starting step ${index + 1}`);
        },
        onStepComplete: (step, index, result) => {
          console.log(`\n Completed step ${index + 1}`);
          console.log(`Result for step ${index + 1}:`, result);
        },
        onStreamChunk: (chunk: string) => {
          process.stdout.write(chunk);
        }
      }
    );

    console.log("\n Workflow completed successfully");
    console.log("\nFinal Results:", JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("\n Error:", error);
    throw error;
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error(' Unhandled Rejection:', reason);
});

// Run the main function
main().catch((error) => {
  console.error("\n Fatal Error:", error);
  process.exit(1);
});