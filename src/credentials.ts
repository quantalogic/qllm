// src/credentials.ts

import { fromIni } from "@aws-sdk/credential-providers";
import { AwsCredentialIdentity } from "@aws-sdk/types";
import { getAwsProfile } from './config/config';
import { logger } from './utils/logger';

/**
 * Retrieves AWS credentials based on the configured profile.
 * @returns A Promise resolving to AwsCredentialIdentity
 * @throws Error if credentials cannot be retrieved or are expired
 */
export async function getCredentials(): Promise<AwsCredentialIdentity> {
    try {
        const profile = getAwsProfile();
        logger.debug(`Retrieving credentials for AWS profile: ${profile}`);

        const credentials = await fromIni({ profile })();

        if (credentials.expiration && new Date(credentials.expiration) < new Date()) {
            throw new Error("AWS credentials have expired.");
        }

        logger.debug("AWS credentials retrieved successfully");
        return credentials;
    } catch (error) {
        if (error instanceof Error) {
            const errorMessage = error.message || "Failed to retrieve AWS credentials.";
            logger.error(`Error getting AWS credentials:  ${errorMessage}`);
        } else {
            logger.error("Failed to retrieve AWS credentials.");
        }
        throw new Error("Failed to retrieve AWS credentials. Please check your configuration.");
    }
}

/**
 * Validates AWS credentials by checking for required properties.
 * @param credentials The AWS credentials to validate
 * @returns true if credentials are valid, false otherwise
 */
export function validateCredentials(credentials: AwsCredentialIdentity): boolean {
    return !!(
        credentials.accessKeyId &&
        credentials.secretAccessKey &&
        (!credentials.expiration || new Date(credentials.expiration) > new Date())
    );
}

/**
 * Refreshes AWS credentials if they are close to expiration.
 * @param credentials The current AWS credentials
 * @returns A Promise resolving to refreshed AwsCredentialIdentity if needed, or the original credentials
 */
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