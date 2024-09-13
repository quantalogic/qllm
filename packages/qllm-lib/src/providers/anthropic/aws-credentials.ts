import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import { getCredentials } from '../../utils/cloud/aws/credential';
import { DEFAULT_AWS_BEDROCK_REGION } from './constants';

export const region = () => process.env.AWS_BEDROCK_REGION || DEFAULT_AWS_BEDROCK_REGION;
export const profile = () => process.env.AWS_BEDROCK_PROFILE;

export async function getAwsCredential() {
  const credentials = await getCredentials(region());
  return credentials;
}

export const createAwsBedrockAnthropicProvider = async () => {
  let client;

  try {
    if (process.env.AWS_BEDROCK_PROFILE) {
      // Clear static credentials if using profile
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.AWS_SESSION_TOKEN;

      process.env.AWS_PROFILE = process.env.AWS_BEDROCK_PROFILE; // Set AWS_PROFILE
      // Use profile-based credentials
      const credentials = await getAwsCredential(); // Ensure this function retrieves credentials based on the profile
      if (!credentials || !credentials.accessKeyId || !credentials.secretAccessKey) {
        throw new Error('Failed to retrieve AWS credentials from profile.');
      }
      client = new AnthropicBedrock({
        awsAccessKey: credentials.accessKeyId,
        awsSecretKey: credentials.secretAccessKey,
        awsSessionToken: credentials.sessionToken, // Optional
        awsRegion: region(),
      });
    } else {
      // Fallback to environment variables
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be defined.');
      }
      delete process.env.AWS_PROFILE;

      client = new AnthropicBedrock({
        awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
        awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
        awsSessionToken: process.env.AWS_SESSION_TOKEN, // Optional
        awsRegion: region(),
      });
    }

    const { AnthropicProvider } = await import('./index');
    return new AnthropicProvider({ client });
  } catch (error) {
    console.error('Error creating AWS Bedrock Anthropic Provider:', error);
    throw error; // Rethrow the error after logging
  }
};
