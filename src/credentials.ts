import { fromIni } from "@aws-sdk/credential-providers";
import { AwsCredentialIdentity } from "@aws-sdk/types";
import { STS } from "@aws-sdk/client-sts";
import { logger } from './utils/logger';

const CREDENTIAL_RETRIEVAL_TIMEOUT_MS = 10000;
const CREDENTIAL_REFRESH_THRESHOLD_MS = 55 * 60 * 1000; // 55 minutes
const SESSION_DURATION_SECONDS = 3600; // 1 hour

interface TemporaryCredentials extends AwsCredentialIdentity {
  expiration: Date;
  sessionToken: string;
}

export async function getCredentials(awsProfile: string, awsRegion: string): Promise<TemporaryCredentials> {
  try {
    logger.debug(`Retrieving credentials for AWS profile: ${awsProfile}`);

    const initialCredentials = await Promise.race([
      fromIni({ profile: awsProfile })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Credential retrieval timed out')), CREDENTIAL_RETRIEVAL_TIMEOUT_MS)
      )
    ]);

    const sessionCredentials = await getSessionToken(initialCredentials, awsRegion);

    if (!await validateCredentials(sessionCredentials, awsRegion)) {
      throw new Error(`Invalid or expired AWS credentials for profile: ${awsProfile} and region: ${awsRegion}`);
    }

    logger.debug("AWS session credentials retrieved successfully");
    return sessionCredentials;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error getting AWS credentials: ${error.message} for profile: ${awsProfile} and region: ${awsRegion}`);
    } else {
      logger.error(`Unknown error getting AWS credentials: ${error} for profile: ${awsProfile} and region: ${awsRegion}`);
    }
    throw new Error(`Failed to retrieve AWS credentials. Please check your configuration for profile: ${awsProfile} and region: ${awsRegion}`);
  }
}

async function getSessionToken(credentials: AwsCredentialIdentity, awsRegion: string): Promise<TemporaryCredentials> {
  const sts = new STS({ credentials, region: awsRegion });
  const response = await sts.getSessionToken({ DurationSeconds: SESSION_DURATION_SECONDS });

  if (!response.Credentials) {
    throw new Error(`Failed to get session token from AWS STS region: ${awsRegion}`);
  }

  return {
    accessKeyId: response.Credentials.AccessKeyId!,
    secretAccessKey: response.Credentials.SecretAccessKey!,
    sessionToken: response.Credentials.SessionToken!,
    expiration: new Date(response.Credentials.Expiration!)
  };
}

async function validateCredentials(credentials: TemporaryCredentials, awsRegion: string): Promise<boolean> {
  if (!(credentials.accessKeyId && credentials.secretAccessKey && credentials.sessionToken)) {
    logger.error("Missing required credential components");
    return false;
  }

  if (new Date(credentials.expiration) <= new Date()) {
    logger.error("Temporary credentials have expired");
    return false;
  }

  try {
    const sts = new STS({ credentials, region: awsRegion });
    await sts.getCallerIdentity({});
    logger.debug("Credentials validated successfully with AWS STS");
    return true;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Failed to validate credentials with AWS STS: ${error.message}`);
    } else {
      logger.error(`Unknown error validating credentials with AWS STS: ${error}`);
    }
    return false;
  }
}

export async function refreshCredentialsIfNeeded(credentials: TemporaryCredentials, awsProfile: string, awsRegion: string): Promise<TemporaryCredentials> {
  const expirationTime = new Date(credentials.expiration);
  const currentTime = new Date();
  const timeUntilExpiration = expirationTime.getTime() - currentTime.getTime();

  if (timeUntilExpiration < CREDENTIAL_REFRESH_THRESHOLD_MS) {
    logger.debug("Temporary credentials are close to expiration. Refreshing...");
    return getCredentials(awsProfile, awsRegion);
  } else {
    logger.debug(`Temporary credentials are still valid for ${timeUntilExpiration / 1000} seconds. No refresh needed.`);
    return credentials;
  }
}

export async function getAndRefreshCredentials(awsProfile: string, awsRegion: string): Promise<TemporaryCredentials> {
  const credentials = await getCredentials(awsProfile, awsRegion);
  return refreshCredentialsIfNeeded(credentials, awsProfile, awsRegion);
}

export function logCredentialInfo(credentials: TemporaryCredentials) {
  logger.info(`Temporary credentials will expire at: ${credentials.expiration.toISOString()}`);
  logger.debug(`Access Key ID: ${credentials.accessKeyId.substring(0, 5)}...`);
  logger.debug(`Has Secret Access Key: ${!!credentials.secretAccessKey}`);
  logger.debug(`Has Session Token: ${!!credentials.sessionToken}`);
}
