// src/credentials.ts
import { fromIni } from "@aws-sdk/credential-providers";
import { AwsCredentialIdentity } from "@aws-sdk/types";
import { AWS_PROFILE } from './config';

export async function getCredentials(): Promise<AwsCredentialIdentity> {
  try {
    const credentials = await fromIni({ profile: AWS_PROFILE })();
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