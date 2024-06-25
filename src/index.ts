import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fromIni } from "@aws-sdk/credential-providers";
import { AwsCredentialIdentity } from "@aws-sdk/types";

const modelid = "anthropic.claude-3-5-sonnet-20240620-v1:0"

const pathEnv = path.resolve(__dirname, '../.env');

// Load environment variables from .env file
const res = dotenv.config({ path: pathEnv });


console.log('dotenv.config:', res);

// Explicitly set AWS_PROFILE and AWS_REGION from the .env file if available
if (res.parsed) {
  process.env.AWS_PROFILE = res.parsed.AWS_PROFILE || process.env.AWS_PROFILE || 'default';
  process.env.AWS_REGION = res.parsed.AWS_REGION || process.env.AWS_REGION || 'us-west-2';
}


// Define the AWS profile and region
const AWS_PROFILE = process.env.AWS_PROFILE || 'default';
const AWS_REGION = process.env.AWS_REGION || 'us-west-2';


console.log('AWS_PROFILE:', AWS_PROFILE);
console.log('AWS_REGION:', AWS_REGION);

async function getCredentials(): Promise<AwsCredentialIdentity> {
  try {
    const credentials = await fromIni({ profile: AWS_PROFILE })();
    // Check if the credentials include an expiration field and if it's in the past
    if (credentials.expiration && new Date(credentials.expiration) < new Date()) {
      console.error("AWS credentials have expired. Please refresh them.");
      throw new Error("AWS credentials have expired.");
    }
    return credentials;
  } catch (error) {
    console.error("Error getting credentials:", error);
    throw error;
  }
}

async function main() {
  try {
    // Get AWS credentials
    const credentials = await getCredentials();

    // Configure the AnthropicBedrock client using the credentials
    const client = new AnthropicBedrock({
      awsAccessKey: credentials.accessKeyId,
      awsSecretKey: credentials.secretAccessKey,
      awsSessionToken: credentials.sessionToken,
      awsRegion: AWS_REGION,
    });

    // Create a message using Claude 3 Sonnet on Bedrock
    const message = await client.messages.create({
      model: modelid,
      max_tokens: 256,
      messages: [
        { role: 'user', content: 'Hello, Claude! What are the benefits of using AWS Bedrock?' }
      ]
    });

    console.log('Claude\'s response:');
    console.log(message.content);

    // Example of streaming the response
    console.log('\nStreaming response:');
    const stream = client.messages.stream({
      model: modelid,
      max_tokens: 256,
      messages: [
        { role: 'user', content: 'Explain the concept of serverless computing in simple terms.' }
      ]
    });

    stream.on('text', (text) => {
      process.stdout.write(text);
    });

    const finalMessage = await stream.finalMessage();
    console.log('\n\nFinal streamed message:');
    console.log(finalMessage.content);

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();