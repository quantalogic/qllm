// // demo-s3-loader.ts
// import { S3LoaderTool } from "qllm-lib/src/tools/s3-loader.tool"; // Adjust the path if necessary
// import dotenv from 'dotenv';
// dotenv.config();

// // Main function to test the S3LoaderTool
// async function demoS3LoaderTool() {
//   try {
//     // Step 1: Get configuration from environment variables
//     const aws_access_key_id = process.env.AWS_ACCESS_KEY_ID;
//     const aws_secret_access_key = process.env.AWS_SECRET_ACCESS_KEY;
//     const aws_region = process.env.AWS_REGION;
//     const aws_endpoint_url = process.env.AWS_ENDPOINT_URL;

//     // Validate required environment variables
//     if (!aws_access_key_id || !aws_secret_access_key || !aws_region) {
//       throw new Error('Missing required AWS credentials in environment variables');
//     }

//     // Step 2: Instantiate the S3LoaderTool with the new constructor
//     const s3Loader = new S3LoaderTool(
//       aws_access_key_id,
//       aws_secret_access_key,
//       aws_region,
//       aws_endpoint_url
//     );

//     // Step 3: Define inputs for the tool
//     const inputs = {
//       bucket: process.env.AWS_BUCKET_NAME,
//       key: "temp/test/tool/encrypted-file.txt",
//       encKey: process.env.ENCKEY
//     };

//     if (!inputs.bucket) {
//       throw new Error('Missing AWS_BUCKET_NAME in environment variables');
//     }

//     // Step 4: Execute the tool and get the output
//     console.log("Executing S3LoaderTool...");
//     const fileContent = await s3Loader.execute(inputs);

//     // Step 5: Log the results
//     console.log("File Content:");
//     console.log(fileContent);
//   } catch (error) {
//     console.error("An error occurred while testing S3LoaderTool:");
//     console.error(error instanceof Error ? error.message : error);
//   }
// }

// // Run the demo function
// demoS3LoaderTool();