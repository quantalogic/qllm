// demo-s3-tool.ts
import { S3Tool } from "qllm-lib/src/tools/s3.tool";
import { DocumentLoader } from "qllm-lib/src/utils/document/document-loader";
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();

async function testS3Operations() {
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
        const uploadDir = path.resolve(__dirname, '../../upload');
        
        // Test 0: Direct Content Upload with Different File Types
        console.log('\n0. Testing direct content upload with different file types...');
        
        // Python file
        try {
            const pythonContent = `
def hello_world():
    print("Hello from Python!")
    return 42
`;
            const pythonResult = await s3Tool.execute({
                operation: 'save',
                bucket: bucketName,
                key: 'test/hello.py',
                content: pythonContent,
                contentType: 'text/python',
                metadata: {
                    'created-by': 'content-test',
                    'language': 'python'
                }
            });
            console.log('✅ Python file upload:', pythonResult);
        } catch (error) {
            console.error('❌ Python file upload failed:', (error as Error).message);
        }

        // TypeScript file
        try {
            const tsContent = `
interface Greeting {
    message: string;
}

function greet(greeting: Greeting): void {
    console.log(greeting.message);
}
`;
            const tsResult = await s3Tool.execute({
                operation: 'save',
                bucket: bucketName,
                key: 'test/greeting.ts',
                content: tsContent,
                contentType: 'text/typescript',
                metadata: {
                    'created-by': 'content-test',
                    'language': 'typescript'
                }
            });
            console.log('✅ TypeScript file upload:', tsResult);
        } catch (error) {
            console.error('❌ TypeScript file upload failed:', (error as Error).message);
        }

        // JSON file
        try {
            const jsonContent = JSON.stringify({
                name: "Test Config",
                version: "1.0.0",
                settings: {
                    enabled: true,
                    timeout: 30
                }
            }, null, 2);
            const jsonResult = await s3Tool.execute({
                operation: 'save',
                bucket: bucketName,
                key: 'test/config.json',
                content: jsonContent,
                contentType: 'application/json',
                metadata: {
                    'created-by': 'content-test',
                    'type': 'configuration'
                }
            });
            console.log('✅ JSON file upload:', jsonResult);
        } catch (error) {
            console.error('❌ JSON file upload failed:', (error as Error).message);
        }

        // YAML file
        try {
            const yamlContent = `
version: '3'
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
`;
            const yamlResult = await s3Tool.execute({
                operation: 'save',
                bucket: bucketName,
                key: 'test/docker-compose.yaml',
                content: yamlContent,
                contentType: 'text/yaml',
                metadata: {
                    'created-by': 'content-test',
                    'type': 'configuration'
                }
            });
            console.log('✅ YAML file upload:', yamlResult);
        } catch (error) {
            console.error('❌ YAML file upload failed:', (error as Error).message);
        }

        // Get all files from the upload directory for the remaining tests
        const dirContents = await fs.readdir(uploadDir);
        const files = dirContents
            .filter(file => !file.includes('load-result'))
            .map(file => ({
                path: path.join(uploadDir, file),
                key: `test/${file}`
            }));

        console.log(`\nFound ${files.length} files to process:`, files.map(f => path.basename(f.path)).join(', '));

        // Test 1: Multiple File Upload
        console.log('\n1. Testing multiple file upload...');
        try {
            const saveResult = await s3Tool.execute({
                operation: 'saveMultiple',
                bucket: bucketName,
                key: files.map(f => f.key),
                filePath: files.map(f => f.path),
                metadata: {
                    'created-by': 'multi-file-test',
                    'timestamp': new Date().toISOString()
                }
            });
            console.log('✅ Save results:', saveResult);
        } catch (error) {
            console.error('❌ Multiple file upload failed:', (error as Error).message);
            return;
        }

        // Test 2: Multiple File Download
        try {
            console.log('\n2. Testing multiple file download...');
            const loadResult = await s3Tool.execute({
                operation: 'loadMultiple',
                bucket: bucketName,
                key: files.map(f => f.key),
                separator: '\n--- Next File ---\n'
            });

            const outputPath = path.join(uploadDir, 'load-result.txt');
            await fs.writeFile(outputPath, loadResult, 'utf-8');
            console.log('✅ Files loaded and written to:', outputPath);
        } catch (error) {
            console.error('❌ Multiple file download failed:', (error as Error).message);
        }

        // Test 3: Move Operation
        try {
            console.log('\n3. Testing move operation...');
            const testFile = files[0];
            const movedKey = `moved/${path.basename(testFile.key)}`;
            
            const moveResult = await s3Tool.execute({
                operation: 'move',
                bucket: bucketName,
                key: testFile.key,
                destinationBucket: bucketName,
                destinationKey: movedKey
            });
            console.log('✅ Move result:', moveResult);

            // Move it back
            await s3Tool.execute({
                operation: 'move',
                bucket: bucketName,
                key: movedKey,
                destinationBucket: bucketName,
                destinationKey: testFile.key
            });
        } catch (error) {
            console.error('❌ Move operation failed:', (error as Error).message);
        }

        // Test 4: Multiple File Delete
        console.log('\n4. Testing multiple file delete...');
        try {
            const deleteResult = await s3Tool.execute({
                operation: 'deleteMultiple',
                bucket: bucketName,
                key: files.map(f => f.key)
            });
            console.log('✅ Delete results:', deleteResult);
        } catch (error) {
            console.error('❌ Multiple file delete failed:', (error as Error).message);
        }

    } catch (error) {
        console.error('Test failed:', (error as Error).message);
        process.exit(1);
    }
}

// Run the test
console.log('Starting S3 operations test...');
testS3Operations()
    .then(() => console.log('All tests completed'))
    .catch(console.error);