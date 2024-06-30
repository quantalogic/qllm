import { fromIni } from "@aws-sdk/credential-providers";
import { AwsCredentialIdentity } from "@aws-sdk/types";
import { configManager } from './utils/configuration_manager';
import { logger } from './utils/logger';

export async function getCredentials(): Promise<AwsCredentialIdentity> {
  try {
    const config = configManager.getConfig();
    logger.debug(`Retrieving credentials for AWS profile: ${config.awsProfile}`);
    const credentials = await fromIni({ profile: config.awsProfile })();

    if (!validateCredentials(credentials)) {
      throw new Error("Invalid or expired AWS credentials.");
    }

    logger.debug("AWS credentials retrieved successfully");
    return credentials;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to retrieve AWS credentials.";
    logger.error(`Error getting AWS credentials: ${errorMessage}`);
    throw new Error("Failed to retrieve AWS credentials. Please check your configuration.");
  }
}

export function validateCredentials(credentials: AwsCredentialIdentity): boolean {
  return !!(
    credentials.accessKeyId &&
    credentials.secretAccessKey &&
    (!credentials.expiration || new Date(credentials.expiration) > new Date())
  );
}

export async function refreshCredentialsIfNeeded(credentials: AwsCredentialIdentity): Promise<AwsCredentialIdentity> {
  if (!credentials.expiration) {
    return credentials;
  }

  const expirationTime = new Date(credentials.expiration);
  const currentTime = new Date();
  const timeUntilExpiration = expirationTime.getTime() - currentTime.getTime();
  const fiveMinutesInMs = 5 * 60 * 1000;

  if (timeUntilExpiration < fiveMinutesInMs) {
    logger.debug("Credentials are close to expiration. Refreshing...");
    return getCredentials();
  }

  return credentials;
}