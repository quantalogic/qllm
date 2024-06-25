// src/anthropicClient.ts
import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk';
import { AwsCredentialIdentity } from "@aws-sdk/types";
import { AWS_REGION } from './config';

export function createAnthropicClient(credentials: AwsCredentialIdentity): AnthropicBedrock {
  return new AnthropicBedrock({
    awsAccessKey: credentials.accessKeyId,
    awsSecretKey: credentials.secretAccessKey,
    awsSessionToken: credentials.sessionToken,
    awsRegion: AWS_REGION,
  });
}