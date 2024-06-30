import { fromIni } from "@aws-sdk/credential-providers";
import { AwsCredentialIdentity } from "@aws-sdk/types";

export async function getCredentials(awsProfile: string): Promise<AwsCredentialIdentity> {
    try {
        const credentials = await fromIni({ profile: awsProfile })();
        if (credentials.expiration && new Date(credentials.expiration) < new Date()) {
            console.error("AWS credentials have expired. Please refresh them.");
            throw new Error("AWS credentials have expired.");
        }
        return credentials;
    } catch (error) {
        console.error("Error getting credentials:", error);
        throw error;
    }
}
