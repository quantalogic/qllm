import { createLLMProvider, WorkflowManager, WorkflowDefinition } from "qllm-lib";

async function main(): Promise<void> {
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
  try {
    // Load workflow
    await workflowManager.loadWorkflow('https://github.com/YatchiYa/templates_prompts_qllm/blob/main/workflow.yaml');
    console.log("\n✅ Workflow loaded successfully");

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
          console.log(`\n🔍 Starting step ${index + 1}`);
        },
        onStepComplete: (step, index, result) => {
          console.log(`\n✅ Completed step ${index + 1}`);
          console.log(`Result for step ${index + 1}:`, result);
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
main().catch((error) => {
  console.error("\n💥 Fatal Error:", error);
  process.exit(1);
});