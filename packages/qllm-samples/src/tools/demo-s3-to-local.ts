import { S3ToLocalTool } from 'qllm-lib/src/tools/s3_to_local.tool';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    try {
        // Initialize the tool with bucket configuration
        const s3ToLocalTool = new S3ToLocalTool({
            // Optional: provide AWS credentials directly
            // aws_access_key_id: 'your-access-key',
            // aws_secret_access_key: 'your-secret-key',
            // aws_region: 'your-region'
        });
        console.log('S3ToLocalTool initialized');

        // Example 1: Download a single file with cleanup on exit (workflow-style)
        console.log('\nExample 1: Download single file (workflow-style)');
        const singleFileResult = await s3ToLocalTool.execute({
            keys: 'output/s3_content_test_tool.txt',
            bucket: process.env.AWS_BUCKET_NAME!,
        });
        console.log('Downloaded file:', singleFileResult.files[0]);
        console.log('File will be cleaned up when the process exits');

        // Example 2: Download multiple files with timed cleanup (standalone-style)
        console.log('\nExample 2: Download multiple files (standalone-style)');
        const multipleFilesResult = await s3ToLocalTool.execute({
            keys: 'output/s3_content_test_tool.txt | test/docker-compose.yaml | test/hello.py | test/greeting.ts | test/config.json',
            bucket: process.env.AWS_BUCKET_NAME!,
            separator: ' | ',
            cleanupAfter: 60000, // 1 minute
            cleanupOnExit: false // Use timed cleanup instead
        });
        console.log('Downloaded files:', multipleFilesResult.files);
        console.log('Files will be automatically deleted after 1 minute');

        // Example 3: Error handling demonstration
        console.log('\nExample 3: Error handling');
        try {
            await s3ToLocalTool.execute({
                keys: 'non/existent/file.txt',
                bucket: process.env.AWS_BUCKET_NAME!,
                cleanupOnExit: true
            });
        } catch (error: any) {
            if (error instanceof Error) {
                console.error('Expected error for non-existent file:', error.message);
            } else {
                console.error('Expected error for non-existent file:', String(error));
            }
        }

        // Keep the process running to demonstrate both cleanup methods
        console.log('\nFiles have been downloaded.');
        console.log('- Files from Example 1 will be cleaned up when you press Ctrl+C');
        console.log('- Files from Example 2 will be cleaned up after 1 minute');
        console.log('\nPress Ctrl+C to exit...');

    } catch (error: any) {
        console.error('Error in demo:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

// Run the demo
if (require.main === module) {
    main().catch(error => {
        console.error('Error running demo:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    });
}