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
    await workflowManager.loadWorkflow("https://raw.githubusercontent.com/YatchiYa/templates_prompts_qllm/refs/heads/main/jiraaa.yaml");
    console.log("✅ Workflow loaded successfully");

    // Define workflow input variables
    const workflowInput = {
      project_key: "DEMO",
      feature_name: "User Authentication System",
      feature_overview: "Implement a secure user authentication system with login, registration, and password reset functionality.",
      feature_requirements: `- User registration with email verification
- Login with email and password
- Password reset functionality
- Remember me option
- Social media login integration`,
      technical_requirements: `- Use JWT for authentication
- Implement password hashing with bcrypt
- Set up OAuth2 for social login
- Create secure session management
- Implement rate limiting for auth endpoints`,
      api_endpoints: `POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET /api/auth/verify-email
POST /api/auth/social-login`,
      test_scenarios: `1. Test registration with valid/invalid data
2. Verify email verification flow
3. Test password reset process
4. Verify social login integration
5. Test rate limiting and security measures`
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