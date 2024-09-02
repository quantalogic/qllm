import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import { getCredentials } from '../../utils/cloud/aws/credential';
import { DEFAULT_AWS_BEDROCK_REGION, DEFAULT_AWS_BEDROCK_PROFILE } from './constants';

export const region = () => process.env.AWS_BEDROCK_REGION || DEFAULT_AWS_BEDROCK_REGION;
export const profile = () => process.env.AWS_BEDROCK_PROFILE || DEFAULT_AWS_BEDROCK_PROFILE;

export async function getAwsCredential() {
  const credentials = await getCredentials(region());
  return credentials;
}

export const createAwsBedrockAnthropicProvider = async () => {
  process.env.AWS_PROFILE = profile();
  process.env.AWS_REGION = region();
  const credentials = await getAwsCredential();
  const client = new AnthropicBedrock({
    awsSessionToken: credentials.sessionToken,
    awsRegion: region(),
  });

  // Import AnthropicProvider dynamically to avoid circular dependency
  const { AnthropicProvider } = await import('./index');
  return new AnthropicProvider({ client });
};
