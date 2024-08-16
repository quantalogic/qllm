import { fromIni } from "@aws-sdk/credential-providers";
import { AwsCredentialIdentity } from "@aws-sdk/types";
import { STSClient, GetSessionTokenCommand } from "@aws-sdk/client-sts";

/**
 * Retrieves temporary AWS credentials from a specified profile using STS.
 * @param {string} awsProfile - The name of the AWS profile to use.
 * @returns {Promise<AwsCredentialIdentity>} - A promise that resolves to the temporary AWS credentials.
 * @throws Will throw an error if there is an issue retrieving the credentials.
 */
export async function getCredentials(awsProfile: string,awsRegion: string): Promise<AwsCredentialIdentity> {
    try {
        // Load base credentials from the specified profile
        const baseCredentials = await fromIni({ profile: awsProfile })();

        // Initialize STS client with the base credentials
        const stsClient = new STSClient({ credentials: baseCredentials, region: awsRegion});

        // Request temporary session token
        const command = new GetSessionTokenCommand({});
        const response = await stsClient.send(command);

        if (!response.Credentials) {
            throw new Error("Failed to obtain temporary credentials from STS.");
        }

        const { AccessKeyId, SecretAccessKey, SessionToken, Expiration } = response.Credentials;

        // Construct temporary credentials object
        const temporaryCredentials: AwsCredentialIdentity = {
            accessKeyId: AccessKeyId!,
            secretAccessKey: SecretAccessKey!,
            sessionToken: SessionToken,
            expiration: Expiration,
        };

        // Check if the temporary credentials are expired
        if (temporaryCredentials.expiration && new Date(temporaryCredentials.expiration) < new Date()) {
            const errorMessage = "Temporary AWS credentials have expired. Please refresh them.";
            console.error(errorMessage);
            throw new Error(errorMessage);
        }

        return temporaryCredentials;
    } catch (error) {
        console.error("Error getting credentials:", error);
        throw error;
    }
}