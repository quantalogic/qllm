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
    console.log('🚀 Starting S3 single file operations test...\n');

    // Test 1: Upload code content directly
    console.log('📝 Testing code content upload...');
    const codeContent = `
function calculateFibonacci(n: number): number {
    if (n <= 1) return n;
    return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}

console.log(calculateFibonacci(10));
`;

    try {
      const codeUploadResult = await s3Tool.execute({
        operation: 'save',
        bucket: bucketName,
        key: 'test/fibonacci.ts',
        content: codeContent,
        contentType: 'text/typescript',
        metadata: {
          'test-type': 'content-upload',
          'language': 'typescript',
          'timestamp': new Date().toISOString()
        },
        tags: {
          'purpose': 'testing',
          'type': 'code'
        }
      });
      console.log('✅ Code upload result:', codeUploadResult);
    } catch (error) {
      console.error('❌ Code upload failed:', (error as Error).message);
      throw error;
    }

    // Test 2: Upload configuration content
    console.log('\n⚙️ Testing configuration upload...');
    const configContent = {
      app: {
        name: 'MyApp',
        version: '1.0.0',
        environment: 'development',
        features: {
          authentication: true,
          logging: {
            level: 'debug',
            format: 'json'
          }
        }
      },
      database: {
        host: 'localhost',
        port: 5432,
        name: 'myapp_db'
      }
    };

    try {
      const configUploadResult = await s3Tool.execute({
        operation: 'save',
        bucket: bucketName,
        key: 'test/app-config.json',
        content: JSON.stringify(configContent, null, 2),
        contentType: 'application/json',
        metadata: {
          'test-type': 'content-upload',
          'config-type': 'application',
          'timestamp': new Date().toISOString()
        },
        tags: {
          'purpose': 'testing',
          'type': 'config'
        }
      });
      console.log('✅ Config upload result:', configUploadResult);
    } catch (error) {
      console.error('❌ Config upload failed:', (error as Error).message);
      throw error;
    }

    // Test 3: Download and verify content
    console.log('\n📥 Testing content download...');
    try {
      const downloadResult = await s3Tool.execute({
        operation: 'load',
        bucket: bucketName,
        key: 'test/app-config.json'
      });
      console.log('✅ Download successful, content:', downloadResult.slice(0, 100) + '...');
      
      // Parse and verify the JSON content
      const parsedConfig = JSON.parse(downloadResult);
      console.log('✅ Config verification:', 
        parsedConfig.app.name === 'MyApp' ? 'Content matches' : 'Content mismatch');
    } catch (error) {
      console.error('❌ Download failed:', (error as Error).message);
      throw error;
    }

    // Test 4: Move operation
    console.log('\n🔄 Testing move operation...');
    const movedKey = 'test/moved-config.json';
    try {
      const moveResult = await s3Tool.execute({
        operation: 'move',
        bucket: bucketName,
        key: 'test/app-config.json',
        destinationBucket: bucketName,
        destinationKey: movedKey
      });
      console.log('✅ Move result:', moveResult);
    } catch (error) {
      console.error('❌ Move failed:', (error as Error).message);
      throw error;
    }

    // Test 5: Delete operations
    console.log('\n🗑️  Testing delete operations...');
    try {
      // Delete TypeScript file
      const deleteCodeResult = await s3Tool.execute({
        operation: 'delete',
        bucket: bucketName,
        key: 'test/fibonacci.ts'
      });
      console.log('✅ Code file delete result:', deleteCodeResult);

      // Delete moved config file
      const deleteConfigResult = await s3Tool.execute({
        operation: 'delete',
        bucket: bucketName,
        key: movedKey
      });
      console.log('✅ Config file delete result:', deleteConfigResult);
    } catch (error) {
      console.error('❌ Delete failed:', (error as Error).message);
      throw error;
    }

    console.log('\n✨ All single file operations completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', (error as Error).message);
    throw error;
  }
}

// Run the test
testSingleFileOperations().catch(console.error);