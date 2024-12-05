import { S3Tool } from 'qllm-lib/src/tools/s3.tool';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

async function testSingleFileOperations() {
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

    // Test file setup
    const testFilePath = path.join(__dirname, '../../upload/test.txt');
    const s3Key = 'test/single-file-test.txt';
    // const encryptionKey = crypto.randomBytes(32).toString('base64');

    console.log('🚀 Starting S3 single file operations test...\n');

    // Test 1: Upload with encryption
    console.log('📤 Testing encrypted file upload...');
    try {
      const uploadResult = await s3Tool.execute({
        operation: 'save',
        bucket: bucketName,
        key: s3Key,
        filePath: testFilePath,
        contentType: 'text/plain',
        // encKey: encryptionKey,
        metadata: {
          'test-type': 'single-file-encryption',
          'timestamp': new Date().toISOString()
        },
        tags: {
          'purpose': 'testing',
          'encrypted': 'true'
        }
      });
      console.log('✅ Upload result:', uploadResult);
    } catch (error) {
      console.error('❌ Upload failed:', (error as Error).message);
      throw error;
    }

    // Test 2: Download with encryption
    console.log('\n📥 Testing encrypted file download...');
    try {
      const downloadResult = await s3Tool.execute({
        operation: 'load',
        bucket: bucketName,
        key: s3Key,
        // encKey: encryptionKey
      });
      console.log('✅ Download successful, content length:', downloadResult.length);
    } catch (error) {
      console.error('❌ Download failed:', (error as Error).message);
      throw error;
    }

    // Test 3: Move operation
    console.log('\n🔄 Testing move operation...');
    const movedKey = 'test/moved-single-file-test.txt';
    try {
      const moveResult = await s3Tool.execute({
        operation: 'move',
        bucket: bucketName,
        key: s3Key,
        destinationBucket: bucketName,
        destinationKey: movedKey
      });
      console.log('✅ Move result:', moveResult);
    } catch (error) {
      console.error('❌ Move failed:', (error as Error).message);
      throw error;
    }

    // Test 4: Delete operation
    console.log('\n🗑️  Testing delete operation...');
    try {
      const deleteResult = await s3Tool.execute({
        operation: 'delete',
        bucket: bucketName,
        key: movedKey
      });
      console.log('✅ Delete result:', deleteResult);
    } catch (error) {
      console.error('❌ Delete failed:', (error as Error).message);
      throw error;
    }

    console.log('\n🎉 All single file operations completed successfully!');
  } catch (error) {
    console.error('❌ Test suite failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run the test
testSingleFileOperations().catch(console.error);