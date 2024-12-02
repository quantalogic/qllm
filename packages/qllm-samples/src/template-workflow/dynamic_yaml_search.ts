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

  // Define the workflow
  const workflowDefinition: WorkflowDefinition = {
    name: "story_visualization_workflow",
    description: "Generate a story and create scene visualizations",
    defaultProvider: "openai",
    steps: [
      {
        templateUrl: "https://github.com/novagen-conseil/qlstorage-test/blob/main/templates/fb156521-9b94-4937-acd0-8ce9cd6866c3/eabc7a8e-5415-4629-9542-2693b9e5beba/ai-story-generator.yaml",
        name: "step 1",
        description: "dezhbjk,l",
        provider: "openai",
        input: {
          genre: "{{genre}}",
          theme: "{{theme}}",
          word_count: "{{word_count}}",
          target_audience: "{{target_audience}}"
        },
        output: {
          story: "generated_story",
          story_elements: "story_elements"
        }
      },
      {
        templateUrl: "https://github.com/novagen-conseil/qlstorage-test/blob/main/templates/fb156521-9b94-4937-acd0-8ce9cd6866c3/eabc7a8e-5415-4629-9542-2693b9e5beba/scene-visualization-generator.yaml",
        name: "step 2",
        description: "dezefez",
        provider: "openai",
        input: {
          scene_text: "$generated_story",
          visual_style: "{{visual_style}}",
          atmospheric_mood: "{{atmospheric_mood}}"
        },
        output: {
          visualization: "scene_visualization",
          cinematic_elements: "cinematic_notes"
        }
      }
    ]
  };

  try {
    // Load workflow
    console.log("workflowDefinition : ", workflowDefinition)
    // const workflowDefinition = await workflowManager.loadWorkflow('https://github.com/YatchiYa/templates_prompts_qllm/blob/main/workflow.yaml');
    await workflowManager.loadWorkflow(workflowDefinition);
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