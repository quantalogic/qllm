// // src/demo-s3saver-tool.ts
// import { S3SaverTool } from "qllm-lib/src/tools/s3-saver.tool";
// import dotenv from 'dotenv';
// dotenv.config();

// async function demoS3SaverTool() {
//    // Step 1: Get configuration from environment variables
//    const aws_access_key_id = process.env.AWS_ACCESS_KEY_ID;
//    const aws_secret_access_key = process.env.AWS_SECRET_ACCESS_KEY;
//    const aws_region = process.env.AWS_REGION;
//    const aws_endpoint_url = process.env.AWS_ENDPOINT_URL;

//    // Validate required environment variables
//    if (!aws_access_key_id || !aws_secret_access_key || !aws_region) {
//      throw new Error('Missing required AWS credentials in environment variables');
//    }

//    // Step 2: Initialize the tool
//    const s3Saver = new S3SaverTool(
//      aws_access_key_id,
//      aws_secret_access_key,
//      aws_region,
//      aws_endpoint_url
//    );

//     const bucketName = process.env.AWS_BUCKET_NAME;
//     console.log(bucketName)


//     try {
//         // Test case 1: Basic file upload
//         const basicResult = await s3Saver.execute({
//         bucket: bucketName,
//         key: 'temp/test/tool/test-file.txt',
//         content: 'Hello, this is a test file!',
//         contentType: 'text/plain'
//         });
//     console.log('Basic upload successful:', basicResult);

//     // Test case 2: Upload with encryption
//     const encryptedResult = await s3Saver.execute({
//       bucket: bucketName,
//       key: 'temp/test/tool/encrypted-file.txt',
//       content: 'This is a secret message!',
//       contentType: 'text/plain',
//       encKey: 'LvBEjwLwc7lPfemE3hscELH8gqc7keZQhUqP4b1I2K8='
//     });
//     console.log('Encrypted upload successful:', encryptedResult);

//     // Test case 3: Upload JSON content
//     const jsonResult = await s3Saver.execute({
//       bucket: bucketName,
//       key: 'temp/test/tool/data.json',
//       content: JSON.stringify({ message: 'Hello World' }),
//       contentType: 'application/json'
//     });
//     console.log('JSON upload successful:', jsonResult);

//   } catch (error) {
//     console.error('Error during demonstration:', error);
//   }
// }

// // Run the demonstration
// demoS3SaverTool()
//   .then(() => console.log('Demonstration completed'))
//   .catch(error => console.error('Demonstration failed:', error));