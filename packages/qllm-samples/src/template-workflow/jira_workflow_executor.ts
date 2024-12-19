import { createLLMProvider, WorkflowManager } from "qllm-lib";
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

async function main(): Promise<void> {
  console.log("\n🔍 Debug - Starting Jira workflow execution");

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
    // Load workflow from local file
    await workflowManager.loadWorkflow("/home/yarab/Bureau/qllm/packages/qllm-samples/src/template-workflow/workflow_jira.yaml");
    console.log("✅ Workflow loaded successfully");

    // Define workflow input variables
    const workflowInput = {
      project_key: "DEM",
      feature_name: "User Authentication System",
      feature_overview: "Implement a secure user authentication system with login.",
      feature_requirements: `- User login with email verification`,
      technical_requirements: `- Use JWT for authentication`,
      api_endpoints: `POST /api/auth/login`,
      test_scenarios: `1. Verify social login integration `,
      host: 'https://novagenlab.atlassian.net/',
      email: 'yarab@novagen.tech',
      token: 'ATATT3xFfGF0MNMZY52cSRWkQlQmsNgD8bBK3cFy2v3Fgl0sQofoM_J-eVSVYlMqNn5akZqx6iyPOPfV3AZzB-ENm9JHb7RP2q1N7OsREkfkGrkYksqU11NByKUVFnDn_hUStBEk-OYssguz7IctkEnVJu5vbdSUW1QI2FF6CdOkziplEQyo5ko=81F6497C',
    };

    // Execute workflow with progress tracking
    const result = await workflowManager.runWorkflow(
      'jira_template_workflow',
      workflowInput,
      {
        onStepStart: (step, index) => {
          console.log(`\n🔍 Starting step ${index + 1}: ${step.name}`);
        },
        onStepComplete: (step, index, result) => {
          console.log(`\n✅ Completed step ${index + 1}: ${step.name}`);
          console.log('Result:', JSON.stringify(result, null, 2));
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