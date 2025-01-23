import { dot } from "node:test/reporters";
import { createLLMProvider, WorkflowManager, WorkflowDefinition, getLLMProvider } from "qllm-lib";
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();



async function createProvidersForWorkflow(
  data: any,
): Promise<Record<string, any>> {
  const providers: Record<string, any> = {}; 

  // Initialize all providers in parallel
  const providerResults = await Promise.all(
    Array.from(data).map(async (providerType) => {
      try {
        const provider = await getLLMProvider(providerType as string);

        return { providerType, provider };
      } catch (error) {
        console.error(
          `[createProvidersForWorkflow] Failed to create provider ${providerType}:`,
          error,
        );
        throw error;
      }
    }),
  );

  // Assign providers to the result object
  providerResults.forEach(({ providerType, provider }) => {
    providers[providerType as string] = provider;
  });

  return providers;
}


async function main(): Promise<void> {
  try {
    console.log("\n🔍 Debug - Starting workflow execution");

    // Create providers
      const providers = await createProvidersForWorkflow(["openai", "aws-anthropic"]);
    // Initialize workflow manager
    const workflowManager = new WorkflowManager(providers); 

    // Debug: Print environment variables
    console.log('🔍 Debug: Environment variables:');

    // Load workflow
    await workflowManager.loadWorkflow("https://github.com/YatchiYa/templates_prompts_qllm/blob/main/workflows/36274a11-9acf-4952-a26a-ae7352b682dd/9e8a7beb-0f0f-4d51-9b57-5741a5eb7665/omgv.yaml");
    console.log("\n✅ Workflow loaded successfully");

    // Define workflow input variables
    const workflowInput = {
      "title": "loev and hate"
  };

    // Debug: Print parameters
    console.log('🔍 Debug: Parameters:', JSON.stringify(workflowInput, null, 2));


    // Execute workflow with progress tracking
    console.log('🔍 Debug: Starting workflow execution...');

    const result = await workflowManager.runWorkflow(
      "omgv",
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
              bucket_name: stepInputs.bucket_name,
              key: stepInputs.key,
              types: {
                bucket_name: typeof stepInputs.bucket_name,
                key: typeof stepInputs.key,
                step: typeof step,
                inputs: typeof stepInputs
              },
              templates: {
                bucket: stepInputs.bucket_name?.includes('{{') || stepInputs.bucket_name?.includes('${'),
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