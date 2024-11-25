/**
 * @fileoverview AWS Bedrock client utilities for interacting with foundation models.
 * Provides functionality to list and interact with AWS Bedrock foundation models.
 * 
 * @author QLLM Team
 * @module utils/cloud/aws/bedrock
 */

import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { AwsCredentialIdentity } from '@aws-sdk/types';

/**
 * Represents a foundation model in AWS Bedrock.
 */
interface Model {
  /** Unique identifier of the model */
  id: string;
  /** Display name of the model */
  name: string;
  /** Detailed description including input/output modalities */
  description: string;
}

/**
 * Lists available foundation models in AWS Bedrock.
 * 
 * @param {AwsCredentialIdentity} credentials - AWS credentials for authentication
 * @param {string} [region='us-east-1'] - AWS region where Bedrock is deployed
 * @returns {Promise<Model[]>} Array of available foundation models
 * @throws {Error} If listing models fails
 * 
 * @example
 * ```typescript
 * import { fromEnv } from './credential';
 * 
 * const credentials = await fromEnv();
 * const models = await listModels(credentials);
 * console.log('Available models:', models);
 * ```
 */
export async function listModels(
  credentials: AwsCredentialIdentity,
  region: string = 'us-east-1',
): Promise<Model[]> {
  const client = new BedrockClient({
    credentials,
    region,
  });

  try {
    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);

    const models: Model[] =
      response.modelSummaries?.map((summary) => ({
        id: summary.modelId || '',
        name: summary.modelName || '',
        description: `${summary.modelName || ''} - Input: ${summary.inputModalities?.join(', ') || 'N/A'}, Output: ${summary.outputModalities?.join(', ') || 'N/A'}`,
      })) || [];

    return models;
  } catch (error) {
    console.error('Error listing foundation models:', error);
    throw new Error('Failed to list foundation models');
  }
}
