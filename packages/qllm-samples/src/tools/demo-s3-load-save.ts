// test-s3-load.ts
import { S3Tool } from "qllm-lib/src/tools/s3.tool";
import dotenv from 'dotenv';
dotenv.config();

async function testS3LoadOperation() {
    try {
        // Configuration setup
        const config = {
            aws_access_key_id: process.env.AWS_ACCESS_KEY_ID!,
            aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY!,
            aws_region: process.env.AWS_REGION!,
            aws_endpoint_url: process.env.AWS_ENDPOINT_URL
        };

        // Validate configuration
        if (!config.aws_access_key_id || !config.aws_secret_access_key || !config.aws_region) {
            throw new Error('Missing required AWS credentials in environment variables');
        }

        const bucketName = process.env.AWS_BUCKET_NAME!;
        if (!bucketName) {
            throw new Error('Missing AWS_BUCKET_NAME in environment variables');
        }

        const s3Tool = new S3Tool(config);
        const testKey = 'test/load-test-file.txt';
        const testContent = 'This is a test file content for load operation';

        // Step 1: Save a test file
        console.log('\n1. Saving test file...');
        try {
            const saveResult = await s3Tool.execute({
                operation: 'save',
                bucket: bucketName,
                key: testKey,
                content: testContent,
                contentType: 'text/plain',
                metadata: {
                    'created-by': 'load-test',
                    'timestamp': new Date().toISOString()
                },
                tags: {
                    'test-type': 'load-operation',
                    'purpose': 'testing'
                }
            });
            console.log('✅ Save successful:', saveResult);
        } catch (error) {
            console.error('❌ Save failed:', (error as Error).message);
            return;
        }

        // Step 2: Load the file
        console.log('\n2. Loading test file...');
        try {
            const loadResult = await s3Tool.execute({
                operation: 'load',
                bucket: bucketName,
                key: testKey
            });
            console.log('✅ Load successful');
            console.log('Content:', loadResult);
            console.log('Content matches:', loadResult === testContent);
        } catch (error) {
            console.error('❌ Load failed:', (error as Error).message);
        }

        // Step 3: Clean up - Delete the test file
        console.log('\n3. Cleaning up - Deleting test file...');
        try {
            const deleteResult = await s3Tool.execute({
                operation: 'delete',
                bucket: bucketName,
                key: testKey
            });
            console.log('✅ Cleanup successful:', deleteResult);
        } catch (error) {
            console.error('❌ Cleanup failed:', (error as Error).message);
        }

    } catch (error) {
        console.error('Test failed:', (error as Error).message);
    }
}

// Run the test
console.log('Starting S3 load operation test...');
testS3LoadOperation()
    .then(() => console.log('Test completed'))
    .catch(error => console.error('Test failed:', error));