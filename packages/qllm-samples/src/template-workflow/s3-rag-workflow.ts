import { createLLMProvider, WorkflowManager, WorkflowDefinition } from "qllm-lib";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function main(): Promise<void> {
  console.log("\n🔍 Starting S3-RAG Workflow Demo");

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
      name: "s3_rag_analysis",
      description: "Download files from S3 and analyze them using RAG",
      defaultProvider: "openai",
      steps: [
        {
          tool: "s3ToLocal",
          name: "download_files",
          description: "Download files from S3 bucket",
          input: {
            keys: "{{files}}",
            bucket_name: "{{bucket}}",
            separator: " | ",
            cleanupAfter: 300000, // 5 minutes
            cleanupOnExit: true
          },
          output: "download_result"
        },
        {
          tool: "LlamaIndexRAGV1",
          name: "analyze_files",
          description: "Analyze downloaded files using RAG",
          input: {
            directory: "$download_result",
            query: "{{query}}",
            embedModel: "openai",
            topK: "5"
          },
          output: "rag_result"
        }
      ]
    };

    // Register the workflow
    await workflowManager.loadWorkflow(workflowDefinition);
    console.log("\n✅ Workflow registered successfully");

    // Define workflow input variables
    const workflowInput = {
      files: "2297fde2-cede-4a08-a78c-0aaee8f15570-475c618e-189f-4b3c-93a4-750d9a2ec938-acr.pdf | 2297fde2-cede-4a08-a78c-0aaee8f15570-475c618e-189f-4b3c-93a4-750d9a2ec938-11-03-08_pleading_v-ep_fr.pdf",
      bucket: process.env.AWS_S3_BUCKET_NAME!,
      query: "Give me the main points discussed in these documents, and improve them to have a better understanding of the topic. Generate a comprehensive analysis."
    };

    // Execute workflow with progress tracking
    const result = await workflowManager.runWorkflow(
      "s3_rag_analysis",
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
