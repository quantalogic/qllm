import { CustomApiServerCallTool } from "qllm-lib";
import dotenv from 'dotenv';

dotenv.config();

async function main(): Promise<void> {
  try {
    console.log("\n Debug - Starting custom API test");

    const customApiCall = new CustomApiServerCallTool();
    
    // Define input data
    const workflowInput = { 
      repository: "/tmp/s3_to_local/FRGTY",
      query: "give me the main points discussed" ,
      headers: JSON.stringify({
        "Content-Type": "application/json",
        "accept": "application/json"
      })
    };

    // Debug: Print input
    console.log('\n Debug: API input:', JSON.stringify(workflowInput, null, 2));

    const result = await customApiCall.execute({
      url: "http://localhost:8001/api/raglite/upload_and_query",
      method: "POST",
      ...workflowInput
    });

    console.log("\n API call completed");
    console.log('Response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('\n Error during API call:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n Debug: Unhandled rejection:', reason);
  if (reason instanceof Error) {
    console.error('Error name:', reason.name);
    console.error('Error message:', reason.message);
    console.error('Stack trace:', reason.stack);
  }
  process.exit(1);
});

// Run the main function
main();
