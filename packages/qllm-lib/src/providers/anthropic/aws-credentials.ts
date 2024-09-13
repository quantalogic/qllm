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

  if (process.env.AWS_BEDROCK_PROFILE) {
    // Use profile-based credentials
    const credentials = await getAwsCredential(); // Ensure this function retrieves credentials based on the profile
    client = new AnthropicBedrock({
      awsAccessKey: credentials.accessKeyId,
      awsSecretKey: credentials.secretAccessKey,
      awsSessionToken: credentials.sessionToken, // Optional
      awsRegion: region(),
    });
  } else {
    // Fallback to environment variables
    client = new AnthropicBedrock({
      awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
      awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
      awsRegion: region(),
    });
  }

  const { AnthropicProvider } = await import('./index');
  return new AnthropicProvider({ client });
};
