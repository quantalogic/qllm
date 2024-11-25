/**
 * @fileoverview AWS credential management utilities with caching and automatic refresh.
 * Provides functionality for retrieving, caching, and refreshing AWS credentials using STS.
 * 
 * Features:
 * - Temporary credential generation using STS
 * - Credential caching
 * - Automatic refresh before expiration
 * - Configurable expiration threshold
 * 
 * @author QLLM Team
 * @module utils/cloud/aws/credential
 */

import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { STSClient, GetSessionTokenCommand } from '@aws-sdk/client-sts';

/**
 * Extended AWS credentials interface that includes expiration time.
 */
interface CachedCredentials extends AwsCredentialIdentity {
  /** Expiration timestamp for the credentials */
  expiration: Date;
}

/** Cache for storing the current credentials */
let cachedCredentials: CachedCredentials | null = null;

/** Time threshold before expiration to trigger refresh (5 minutes) */
const EXPIRATION_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Retrieves temporary AWS credentials using STS.
 * If valid credentials are cached, returns those instead of making a new request.
 * 
 * @param {string} awsRegion - AWS region for STS client
 * @returns {Promise<AwsCredentialIdentity>} Temporary AWS credentials
 * @throws {Error} If credential retrieval fails
 * 
 * @example
 * ```typescript
 * try {
 *   const credentials = await getCredentials('us-east-1');
 *   // Use credentials with AWS SDK clients
 *   const s3Client = new S3Client({ credentials });
 * } catch (error) {
 *   console.error('Failed to get credentials:', error);
 * }
 * ```
 */
export async function getCredentials(awsRegion: string): Promise<AwsCredentialIdentity> {
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
 * Considers credentials invalid if they are within the expiration threshold.
 * 
 * @param {CachedCredentials} credentials - Credentials to validate
 * @returns {boolean} True if credentials are valid and not near expiration
 * 
 * @private
 */
function isCredentialValid(credentials: CachedCredentials): boolean {
  const now = new Date();
  return credentials.expiration.getTime() - now.getTime() > EXPIRATION_THRESHOLD_MS;
}

/**
 * Refreshes AWS credentials if they are expired or close to expiration.
 * If current credentials are valid, returns them without making a new request.
 * 
 * @param {string} awsRegion - AWS region for STS client
 * @returns {Promise<AwsCredentialIdentity>} Current or refreshed AWS credentials
 * 
 * @example
 * ```typescript
 * // Periodically refresh credentials
 * setInterval(async () => {
 *   try {
 *     await refreshCredentialsIfNeeded('us-east-1');
 *   } catch (error) {
 *     console.error('Failed to refresh credentials:', error);
 *   }
 * }, 60000);
 * ```
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
 * Useful when credentials need to be explicitly invalidated.
 * 
 * @example
 * ```typescript
 * // Force new credentials on next request
 * clearCachedCredentials();
 * const freshCredentials = await getCredentials('us-east-1');
 * ```
 */
export function clearCachedCredentials(): void {
  cachedCredentials = null;
}
