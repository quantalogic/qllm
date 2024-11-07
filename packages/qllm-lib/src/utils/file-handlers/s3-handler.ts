// src/utils/file-handlers/s3-handler.ts
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { FileHandler } from '../../types';

export class S3FileHandler implements FileHandler {
    private client: S3Client;

    constructor(region: string = 'us-east-1') {
        this.client = new S3Client({ region });
    }

    private parseS3Url(s3Url: string): { Bucket: string; Key: string } {
        const url = new URL(s3Url);
        return {
            Bucket: url.hostname.split('.')[0],
            Key: url.pathname.slice(1)
        };
    }

    async read(s3Url: string): Promise<string> {
        try {
            const params = this.parseS3Url(s3Url);
            const command = new GetObjectCommand(params);
            const response = await this.client.send(command);
            
            if (!response.Body) {
                throw new Error('Empty response from S3');
            }

            return await response.Body.transformToString();
        } catch (error) {
            throw new Error(`Failed to read S3 file: ${error as Error}`);
        }
    }

    async exists(s3Url: string): Promise<boolean> {
        try {
            const params = this.parseS3Url(s3Url);
            const command = new HeadObjectCommand(params);
            await this.client.send(command);
            return true;
        } catch {
            return false;
        }
    }

    async getType(s3Url: string): Promise<string> {
        try {
            const params = this.parseS3Url(s3Url);
            const command = new HeadObjectCommand(params);
            const response = await this.client.send(command);
            return response.ContentType || 'text/plain';
        } catch {
            return 'text/plain';
        }
    }
}