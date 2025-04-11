/**
 * @fileoverview AWS credentials management for Anthropic Bedrock integration.
 * Handles credential retrieval and provider initialization for AWS Bedrock access.
 * 
 * @author QLLM Team
 * @version 1.0.0
 */

import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import { getCredentials } from '../../utils/cloud/aws/credential';
import { DEFAULT_AWS_BEDROCK_REGION } from './constants';

/**
 * Retrieves the AWS region for Bedrock service.
 * Falls back to default region if not specified in environment.
 * 
 * @returns {string} AWS region identifier
 */
export const region = () => process.env.AWS_BEDROCK_REGION || DEFAULT_AWS_BEDROCK_REGION;

/**
 * Retrieves the AWS profile name for Bedrock service.
 * 
 * @returns {string | undefined} AWS profile name if specified
 */
export const profile = () => process.env.AWS_BEDROCK_PROFILE;

/**
 * Retrieves AWS credentials for the specified region.
 * 
 * @returns {Promise<AWS.Credentials>} AWS credentials object
 */
export async function getAwsCredential() {
  const credentials = await getCredentials(region());
  return credentials;
}

/**
 * Creates an Anthropic provider instance configured for AWS Bedrock.
 * Handles both profile-based and environment-based credentials.
 * 
 * @returns {Promise<AnthropicProvider>} Configured Anthropic provider instance
 * @throws {Error} When required AWS credentials are not available
 */
export const createAwsBedrockAnthropicProvider = async (options?: {
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  region?: string;
}) => {
  let client;

  try {
    if (options?.accessKeyId && options?.secretAccessKey) {
      // Use provided credentials
      client = new AnthropicBedrock({
        awsAccessKey: options.accessKeyId,
        awsSecretKey: options.secretAccessKey,
        awsSessionToken: options.sessionToken,
        awsRegion: options.region || region(),
      });
    } else if (process.env.AWS_BEDROCK_PROFILE) {
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
