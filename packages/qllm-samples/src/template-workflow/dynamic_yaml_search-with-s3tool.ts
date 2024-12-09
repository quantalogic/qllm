import { dot } from "node:test/reporters";
import { createLLMProvider, WorkflowManager, WorkflowDefinition } from "qllm-lib";
import dotenv from 'dotenv';
import path from 'path';
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

    // Debug: Print environment variables
    console.log('🔍 Debug: Environment variables:');
    console.log('AWS_BUCKET_NAME:', process.env.AWS_BUCKET_NAME);

    // Load workflow
    await workflowManager.loadWorkflow("https://raw.githubusercontent.com/jluongg/templates_prompts_qllm/refs/heads/main/s3-content-writer2.yaml");
    console.log("\n✅ Workflow loaded successfully");

    // Define workflow input variables
    const workflowInput = {
      // genre: "romance",
      theme: "space exploration",
      word_count: "1000",
      target_audience: "young adults",
      visual_style: "cinematic",
      atmospheric_mood: "mysterious",
      bucket_name: process.env.AWS_BUCKET_NAME!,
      // Pass keys directly as strings to avoid template substitution issues
      load_key: "input/s3_content_test_tool.txt",
      save_key: "output/s3_content_test_tool.txt",
      local_save_path: "s3_content_test_tool.txt"
    };

    // Debug: Print parameters
    console.log('🔍 Debug: Parameters:', JSON.stringify(workflowInput, null, 2));

    // Debug: Print S3 configuration
    console.log('\n🔍 Debug: S3 Configuration:');
    console.log('Bucket:', workflowInput.bucket_name);
    console.log('Load Key:', workflowInput.load_key);
    console.log('Save Key:', workflowInput.save_key);
    console.log('Local Save Path:', workflowInput.local_save_path);

    // Execute workflow with progress tracking
    console.log('🔍 Debug: Starting workflow execution...');

    const result = await workflowManager.runWorkflow(
      "story_visualization_workflow",
      workflowInput,
      {
        onStepStart: async (step: any, index: number) => {
          console.log('\n🔍 Starting step', index + 1, ':');
          console.log('Step:', JSON.stringify(step, null, 2));
          
          // Check both input and inputs
          const stepInputs = step.inputs || step.input;
          if (stepInputs) {
            console.log('Step Inputs:', {
              operation: stepInputs.operation,
              bucket: stepInputs.bucket,
              key: stepInputs.key,
              types: {
                bucket: typeof stepInputs.bucket,
                key: typeof stepInputs.key,
                step: typeof step,
                inputs: typeof stepInputs
              },
              templates: {
                bucket: stepInputs.bucket?.includes('{{') || stepInputs.bucket?.includes('${'),
                key: stepInputs.key?.includes('{{') || stepInputs.key?.includes('${')
              }
            });
            if (index===0) {
              console.log('\n🔍 Debug - template_content value:', stepInputs.output);
            }
          } else {
            console.log('⚠️ No inputs found in step');
          }
        },
        onStepComplete: (step: any, index: number, stepResult: any) => {
          console.log(`\n✅ Completed step ${index + 1}:`, {
            name: step.name,
            type: step.type,
            result: stepResult
          });
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
    // Debug: Print more error details
    if (error instanceof Error) {
      console.error('🔍 Debug: Error stack:', error.stack);
      console.error('🔍 Debug: Error name:', error.name);
      console.error('🔍 Debug: Error message:', error.message);
    }
    throw error;
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔍 Debug: Unhandled rejection:', reason);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  console.error("\n💥 Fatal Error:", error);
  process.exit(1);
});