import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { STSClient, GetSessionTokenCommand } from '@aws-sdk/client-sts';

interface CachedCredentials extends AwsCredentialIdentity {
  expiration: Date;
}

let cachedCredentials: CachedCredentials | null = null;
const EXPIRATION_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Retrieves temporary AWS credentials using STS.
 * @param {string} awsRegion - The AWS region to use.
 * @returns {Promise<AwsCredentialIdentity>} - A promise that resolves to the temporary AWS credentials.
 * @throws Will throw an error if there is an issue retrieving the credentials.
 */
export async function getCredentials(
  awsRegion: string,
): Promise<AwsCredentialIdentity> {
  if (cachedCredentials && isCredentialValid(cachedCredentials)) {
    return cachedCredentials;
  }

  try {
    const baseCredentials = await fromNodeProviderChain()();
    const stsClient = new STSClient({ credentials: baseCredentials, region: awsRegion });
    const command = new GetSessionTokenCommand({});
    const response = await stsClient.send(command);

    if (!response.Credentials) {
      throw new Error('Failed to obtain temporary credentials from STS.');
    }

    const { AccessKeyId, SecretAccessKey, SessionToken, Expiration } = response.Credentials;

    if (!AccessKeyId || !SecretAccessKey || !SessionToken || !Expiration) {
      throw new Error('Incomplete credentials received from STS.');
    }

    cachedCredentials = {
      accessKeyId: AccessKeyId,
      secretAccessKey: SecretAccessKey,
      sessionToken: SessionToken,
      expiration: Expiration,
    };

    return cachedCredentials;
  } catch (error) {
    console.error('Error getting credentials:', error);
    throw new Error(`Failed to retrieve AWS credentials: ${(error as Error).message}`);
  }
}

/**
 * Checks if the given credentials are still valid.
 * @param {CachedCredentials} credentials - The credentials to check.
 * @returns {boolean} - True if the credentials are still valid, false otherwise.
 */
function isCredentialValid(credentials: CachedCredentials): boolean {
  const now = new Date();
  return credentials.expiration.getTime() - now.getTime() > EXPIRATION_THRESHOLD_MS;
}

/**
 * Refreshes the AWS credentials if they are expired or close to expiration.
 * @param {string} awsRegion - The AWS region to use.
 * @returns {Promise<AwsCredentialIdentity>} - A promise that resolves to the refreshed AWS credentials.
 */
export async function refreshCredentialsIfNeeded(
  awsRegion: string,
): Promise<AwsCredentialIdentity> {
  if (!cachedCredentials || !isCredentialValid(cachedCredentials)) {
    return getCredentials(awsRegion);
  }
  return cachedCredentials;
}

/**
 * Clears the cached credentials, forcing a new credential retrieval on the next call.
 */
export function clearCachedCredentials(): void {
  cachedCredentials = null;
}