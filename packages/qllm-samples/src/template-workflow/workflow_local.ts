import { WorkflowManager } from "qllm-lib";
import * as path from 'path';

async function main(): Promise<void> {
    try {
        console.log("\nStarting local file operations workflow execution");

        // Initialize workflow manager
        const workflowManager = new WorkflowManager({});

        // Load workflow from local file
        // const workflowPath = path.join(__dirname, 'workflow_local.yaml');
        // console.log('\nLoading workflow from:', workflowPath);
        await workflowManager.loadWorkflow("https://raw.githubusercontent.com/jluongg/templates_prompts_qllm/refs/heads/main/workflow_local.yaml");
        console.log("Workflow loaded successfully");

        // Create test directory path
        const testDir = path.join(process.cwd(), 'test-files');
        const testFilePath = path.join(testDir, 'test.txt');

        // Define workflow input variables
        const workflowInput = {
            test_file_path: testFilePath,
            test_dir: testDir,
            test_content: 'Hello from workflow test!',
            encoding: 'utf-8'
        };

        // Debug: Print workflow input
        console.log('\nWorkflow input:', JSON.stringify(workflowInput, null, 2));

        // Execute workflow
        console.log('\nExecuting workflow...');
        const result = await workflowManager.runWorkflow('local_file_operations',workflowInput);

        // Print results
        console.log('\nWorkflow Results:');
        console.log('1. Save File Result:', result.saved_file_result);
        console.log('2. Save Nested File Result:', result.nested_file_result);
        console.log('3. Remove File Result:', result.remove_file_result);
        console.log('4. Remove Directory Result:', result.remove_dir_result);

        console.log('\nWorkflow completed successfully');
    } catch (error) {
        console.error('\nWorkflow execution failed:', error);
        throw error;
    }
}

// Run workflow
main().catch(error => {
    console.error('Error in main:', error);
    process.exit(1);
});