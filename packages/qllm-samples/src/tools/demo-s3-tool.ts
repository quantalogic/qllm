// demo-s3-load-pdf.ts
import { S3Tool } from "qllm-lib/src/tools/s3.tool";
import { DocumentLoader } from "qllm-lib/src/utils/document/document-loader";
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();

async function testS3PDFOperation() {
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
        
        // Get all files from the upload directory
        const dirContents = await fs.readdir(uploadDir);
        const files = dirContents
            .filter(file => !file.includes('load-result')) // Exclude load-result files
            .map(file => ({
                path: path.join(uploadDir, file),
                key: `test/${file}`,
                contentType: file.endsWith('.pdf') ? 'application/pdf' : 
                           file.endsWith('.json') ? 'application/json' : 
                           'text/plain'
            }));

        console.log(`Found ${files.length} files to process:`, files.map(f => path.basename(f.path)).join(', '));

        // Step 1: Save files to S3
        console.log('\n1. Saving files to S3...');
        try {
            const saveResult = await s3Tool.execute({
                operation: 'save',
                bucket: bucketName,
                key: files.map(f => f.key),
                filePath: files.map(f => f.path),
                contentType: files[0].contentType, // Note: in a real app, you'd handle different content types per file
                metadata: {
                    'created-by': 'multi-file-test',
                    'timestamp': new Date().toISOString()
                }
            });
            console.log('✅ Save results:', saveResult);

            // Try to load the files using DocumentLoader
            for (const file of files) {
                try {
                    const result = await DocumentLoader.quickLoadString(file.path);
                    console.log(`✅ Local file ${path.basename(file.path)} content length:`, result.content.length);
                } catch (error) {
                    console.log(`ℹ️ Skipped loading ${path.basename(file.path)} (might be binary file)`);
                }
            }
        } catch (error) {
            console.error('❌ Save operation failed:', (error as Error).message);
            return;
        }

        // Step 2: Load all files from S3
        try {
            console.log('\n2. Loading all files from S3...');
            const loadResult = await s3Tool.execute({
                operation: 'load',
                bucket: bucketName,
                key: files.map(f => f.key),
                separator: '\n--- Next File ---\n'
            });

            // Write the result to a file
            const outputPath = path.join(uploadDir, 'load-result.txt');
            await fs.writeFile(outputPath, loadResult, 'utf-8');
            console.log('✅ All files loaded and written to:', outputPath);
        } catch (error) {
            console.error('❌ Load operation failed:', (error as Error).message);
        }

        // Step 3: Delete the files from S3
        console.log('\n3. Deleting files from S3...');
        try {
            const deleteResult = await s3Tool.execute({
                operation: 'delete',
                bucket: bucketName,
                key: files.map(f => f.key)
            });
            console.log('✅ Delete results:', deleteResult);
        } catch (error) {
            console.error('❌ Failed to delete files:', (error as Error).message);
        }

    } catch (error) {
        console.error('Operation failed:', (error as Error).message);
    }
}

// Run the test
console.log('Starting S3 operation test...');
testS3PDFOperation()
    .then(() => console.log('Test completed'))
    .catch(error => console.error('Test failed:', error));