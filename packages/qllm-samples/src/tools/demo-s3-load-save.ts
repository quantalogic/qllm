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
        
        // Get single file to process
        const filePath = path.join(uploadDir, 'demo-s3-tool.ts');  // or any other file you want to process
        const key = 'test/demo-s3-tool.ts';

        // Step 1: Save file to S3
        console.log('\n1. Saving file to S3...');
        try {
            // Save to S3 using streaming upload
            const saveResult = await s3Tool.execute({
                operation: 'save',
                bucket: bucketName,
                key: key,
                filePath: filePath,
                contentType: filePath.endsWith('.pdf') ? 'application/pdf' : 'text/plain',
                metadata: {
                    'created-by': 'single-file-test',
                    'timestamp': new Date().toISOString(),
                    'original-file': path.basename(filePath)
                }
            });
            console.log(`✅ Save successful:`, saveResult);

            // Try to load the file using DocumentLoader
            const result = await DocumentLoader.quickLoadString(filePath);
            console.log(`✅ Local file content length:`, result.content.length);
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
                key: [key],  // Pass as array for loadMultiple
                separator: '\n--- Next File ---\n'
            });

            // Write the result to a file
            const outputPath = path.join(uploadDir, 'load-result.txt');
            await fs.writeFile(outputPath, loadResult, 'utf-8');
            console.log('✅ All files loaded and written to:', outputPath);

            // Step 3: Generate signed URLs for each file
            console.log('\n3. Generating signed URLs...');
            const validFiles = [{ key }];
            for (const file of validFiles) {
                try {
                    const signedUrl = await s3Tool.execute({
                        operation: 'getSignedUrl',
                        bucket: bucketName,
                        key: file.key
                    });
                    console.log(`✅ Signed URL for ${file.key}:`);
                    console.log(signedUrl);
                } catch (error) {
                    console.error(`❌ Failed to generate signed URL for ${file.key}:`, (error as Error).message);
                }
            }
        } catch (error) {
            console.error('❌ Load operation failed:', (error as Error).message);
        }

    //     // Step 4: Delete the files from S3
    //     console.log('\n4. Deleting files from S3...');
    //     try {
    //         const deleteResult = await s3Tool.execute({
    //             operation: 'delete',
    //             bucket: bucketName,
    //             key: key
    //         });
    //         console.log('✅ File deleted successfully:', deleteResult);
    //     } catch (error) {
    //         console.error('❌ Failed to delete file:', (error as Error).message);
    //     }

    } catch (error) {
        console.error('Operation failed:', (error as Error).message);
    }
}

// Run the test
console.log('Starting S3 PDF operation test...');
testS3PDFOperation()
    .then(() => console.log('Test completed'))
    .catch(error => console.error('Test failed:', error));