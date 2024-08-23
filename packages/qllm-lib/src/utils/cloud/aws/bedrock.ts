import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { AwsCredentialIdentity } from '@aws-sdk/types';

interface Model {
  id: string;
  name: string;
  description: string;
}

export async function listModels(
  credentials: AwsCredentialIdentity,
  region: string = 'us-east-1'
): Promise<Model[]> {
  const client = new BedrockClient({ 
    credentials,
    region
  });

  try {
    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);

    const models: Model[] = response.modelSummaries?.map(summary => ({
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