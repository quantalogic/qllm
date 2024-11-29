// demo-dynamic-s3.ts
import { S3Tool } from "qllm-lib/src/tools/s3.tool";
import dotenv from 'dotenv';
dotenv.config();

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function demoS3Tool() {
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

    // Test 1: Save Operation
    console.log('1. Testing Save Operation');
    try {
      const saveResult = await s3Tool.execute({
        operation: 'save',
        bucket: bucketName,
        key: 'test/demo-file.txt',
        content: 'This is a test file content',
        contentType: 'text/plain',
        metadata: {
          'created-by': 'demo-script',
          'timestamp': new Date().toISOString()
        },
        tags: {
          'environment': 'test',
          'purpose': 'demonstration'
        }
      });
      console.log('✅ Save successful:', saveResult);
    } catch (error) {
      console.error('❌ Save failed:', (error as Error).message);
    }

    // Small delay to ensure consistency
    await delay(1000);

    // Test 2: Try to save to the same location (should fail)
    console.log('\n2. Testing Save to Existing Location');
    try {
      await s3Tool.execute({
        operation: 'save',
        bucket: bucketName,
        key: 'test/demo-file.txt',
        content: 'This should fail'
      });
      console.log('❌ Save should have failed but succeeded');
    } catch (error) {
      console.log('✅ Expected failure:', (error as Error).message);
    }

    // Test 3: Load Operation
    console.log('\n3. Testing Load Operation');
    try {
      const loadResult = await s3Tool.execute({
        operation: 'load',
        bucket: bucketName,
        key: 'test/demo-file.txt'
      });
      console.log('✅ Load successful. Content:', loadResult);
    } catch (error) {
      console.error('❌ Load failed:', (error as Error).message);
    }

    // Test 4: Move Operation
    console.log('\n4. Testing Move Operation');
    try {
      const moveResult = await s3Tool.execute({
        operation: 'move',
        bucket: bucketName,
        key: 'test/demo-file.txt',
        destinationBucket: bucketName,
        destinationKey: 'test/moved-demo-file.txt'
      });
      console.log('✅ Move successful:', moveResult);
    } catch (error) {
      console.error('❌ Move failed:', (error as Error).message);
    }

    await delay(1000);

    // Test 5: Try to load from old location (should fail)
    console.log('\n5. Testing Load from Old Location');
    try {
      await s3Tool.execute({
        operation: 'load',
        bucket: bucketName,
        key: 'test/demo-file.txt'
      });
      console.log('❌ Load should have failed but succeeded');
    } catch (error) {
      console.log('✅ Expected failure:', (error as Error).message);
    }

    // Test 6: Load from new location
    console.log('\n6. Testing Load from New Location');
    try {
      const loadResult = await s3Tool.execute({
        operation: 'load',
        bucket: bucketName,
        key: 'test/moved-demo-file.txt'
      });
      console.log('✅ Load successful. Content:', loadResult);
    } catch (error) {
      console.error('❌ Load failed:', (error as Error).message);
    }

    // Test 7: Delete Operation
    console.log('\n7. Testing Delete Operation');
    try {
      const deleteResult = await s3Tool.execute({
        operation: 'delete',
        bucket: bucketName,
        key: 'test/moved-demo-file.txt'
      });
      console.log('✅ Delete successful:', deleteResult);
    } catch (error) {
      console.error('❌ Delete failed:', (error as Error).message);
    }

    await delay(1000);

    // Test 8: Try to delete non-existent file
    console.log('\n8. Testing Delete of Non-existent File');
    try {
      await s3Tool.execute({
        operation: 'delete',
        bucket: bucketName,
        key: 'test/moved-demo-file.txt'
      });
      console.log('❌ Delete should have failed but succeeded');
    } catch (error) {
      console.log('✅ Expected failure:', (error as Error).message);
    }

    console.log('\n=== S3 Operations Test Completed ===\n');

  } catch (error) {
    console.error('\n❌ Demo failed:', error instanceof Error ? error.message : error);
  }
}

// Run the demonstration
console.log('Starting demonstration...');
demoS3Tool()
  .then(() => console.log('Demonstration completed successfully'))
  .catch(error => console.error('Demonstration failed:', error));