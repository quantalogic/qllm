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
    await workflowManager.loadWorkflow('./git.yaml');
    console.log("\n✅ Workflow loaded successfully");

    // Define workflow input variables
    const workflowInput = {
      input: "https://github.com/YatchiYa/argon-react-native",
      excludePatterns: '**/node_modules/**, **/dist/**, **/*.test.js, **/*.spec.ts, **/*.md,.test.ts,/temp/,*.log,*/argon.json',
      //path: "/home/youcef/Bureau/github-repo-analysis.txt",
      include: "**/*.ts, **/*.js",
      returnLocalPath: true,
      embedModel: "openai",
      topK: "5",
      query: "Give me the main points functions and classes in this code, and improve them to have a better understanding of the topic, generate a full article",
    };

    // Execute workflow with progress tracking
    const result = await workflowManager.runWorkflow(
      "github_doc_analysis",
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