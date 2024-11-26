// src/tools/s3-loader.tool.ts
import { 
    S3Client, 
    HeadObjectCommand,
    PutObjectCommand, 
    GetObjectCommand,
    CopyObjectCommand,
    DeleteObjectCommand,
    PutObjectCommandInput,
    GetObjectCommandInput,
    CopyObjectCommandInput,
    DeleteObjectCommandInput,
    HeadObjectCommandOutput,
    NotFound,
    S3ServiceException
 } from "@aws-sdk/client-s3";
import { BaseTool, ToolDefinition } from "./base-tool";
import * as crypto from "crypto"; // For generating MD5 hash of the encryption key

interface S3Config {
    aws_access_key_id: string;
    aws_secret_access_key: string;
    aws_region: string;
    aws_endpoint_url?: string;
    custom_options?: Record<string, any>;
  }
  
  interface S3Operation {
    bucket: string;
    key: string;
    content?: string;
    contentType?: string;
    encKey?: string;
    metadata?: Record<string, string>;
    tags?: Record<string, string>;
    destinationBucket?: string;
    destinationKey?: string;
  }

export class S3Tool extends BaseTool {
    private s3Client: S3Client;
  
    constructor(config: S3Config) {
      const clientConfig = {
        region: config.aws_region,
        credentials: {
          accessKeyId: config.aws_access_key_id,
          secretAccessKey: config.aws_secret_access_key,
        },
        ...(config.aws_endpoint_url && { endpoint: config.aws_endpoint_url }),
        ...config.custom_options
      };
      
      super(clientConfig);
      this.s3Client = new S3Client(clientConfig);
    }
  
    getDefinition(): ToolDefinition {
      return {
        name: 's3-operations',
        description: 'Handles S3 operations with dynamic configuration',
        input: {
          bucket: { type: 'string', required: true, description: 'S3 bucket name' },
          key: { type: 'string', required: true, description: 'S3 object key' },
          operation: { type: 'string', required: true, description: 'Operation type (save/load)' },
          content: { type: 'string', required: false, description: 'Content for save operation' },
          contentType: { type: 'string', required: false, description: 'Content type' },
          encKey: { type: 'string', required: false, description: 'Encryption key' },
          metadata: { type: 'object', required: false, description: 'Custom metadata' },
          tags: { type: 'object', required: false, description: 'Object tags' }
        },
        output: { type: 'string', description: 'Operation result' }
      };
    }

    private async verifyOperation(operation: string, bucket: string, key: string): Promise<void> {
        try {
          const exists = await this.checkFileExists(bucket, key);
          
          switch (operation) {
            case 'save':
              if (exists) {
                throw new Error(`File ${key} already exists in bucket ${bucket}`);
              }
              break;
            case 'load':
            case 'delete':
            case 'move':
              if (!exists) {
                throw new Error(`File ${key} does not exist in bucket ${bucket}`);
              }
              break;
          }
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          throw new Error('Unknown error during operation verification');
        }
    }
    

    private async checkFileExists(bucket: string, key: string): Promise<boolean> {
    try {
        const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: key
        });
        const response: HeadObjectCommandOutput = await this.s3Client.send(command);
        return true;
    } catch (error) {
        if (error instanceof NotFound) {
        return false;
        }
        if (error instanceof S3ServiceException && error.name === 'NotFound') {
        return false;
        }
        if (error instanceof Error && 
            (error.name === 'NotFound' || error.message.includes('NotFound') || error.message.includes('Not Found'))) {
        return false;
        }
        // If it's any other error, we should throw it
        throw error;
    }
    }
  
    async execute(inputs: S3Operation & { operation: 'save' | 'load' | 'move' | 'delete' }): Promise<string> {
      try {
        // Verify operation before executing
        await this.verifyOperation(inputs.operation, inputs.bucket, inputs.key);
      
        // For move operation, also verify destination doesn't exist
        if (inputs.operation === 'move') {
            const destinationExists = await this.checkFileExists(
            inputs.destinationBucket || inputs.bucket,
            inputs.destinationKey!
            );
            if (destinationExists) {
            throw new Error(`Destination file already exists: ${inputs.destinationKey}`);
            }
        }

        switch(inputs.operation) {
          case 'save':
            return await this.saveObject(inputs);
          case 'load':
            return await this.loadObject(inputs);
        case 'move':
          return await this.moveObject(inputs);
        case 'delete':
          return await this.deleteObject(inputs);
          default:
            throw new Error('Unsupported operation');
        }
      } catch (error) {
        throw new Error(`S3 operation failed: ${(error as Error).message}`);
      }
    }
  
    private async saveObject(inputs: S3Operation): Promise<string> {
        console.log("SAVING...")
        if (!inputs.content) {
          throw new Error('Content is required for save operation');
        }
    
        const commandInput: PutObjectCommandInput = {
          Bucket: inputs.bucket,
          Key: inputs.key,
          Body: inputs.content,
          ContentType: inputs.contentType || 'text/plain',
          Metadata: inputs.metadata,
          Tagging: inputs.tags ? this.formatTags(inputs.tags) : undefined
        };
    
        if (inputs.encKey) {
          const encKeyBuffer = Buffer.from(inputs.encKey);
          const md5Hash = crypto.createHash("md5").update(encKeyBuffer).digest("base64");
    
          commandInput.SSECustomerAlgorithm = "AES256";
          commandInput.SSECustomerKey = inputs.encKey;
          commandInput.SSECustomerKeyMD5 = md5Hash;
        }
    
        try {
          const command = new PutObjectCommand(commandInput);
          await this.s3Client.send(command);
          return `s3://${inputs.bucket}/${inputs.key}`;
        } catch (error) {
          throw new Error(`Failed to save object to S3: ${(error as Error).message}`);
        }
      }
    
    private async loadObject(inputs: S3Operation): Promise<string> {
        const commandInput: GetObjectCommandInput = {
          Bucket: inputs.bucket,
          Key: inputs.key
        };
    
        if (inputs.encKey) {
          const encKeyBuffer = Buffer.from(inputs.encKey);
          const md5Hash = crypto.createHash("md5").update(encKeyBuffer).digest("base64");
    
          commandInput.SSECustomerAlgorithm = "AES256";
          commandInput.SSECustomerKey = inputs.encKey;
          commandInput.SSECustomerKeyMD5 = md5Hash;
        }
    
        try {
          const command = new GetObjectCommand(commandInput);
          const response = await this.s3Client.send(command);
          
          if (!response.Body) {
            throw new Error('Empty response body');
          }
    
          const content = await response.Body.transformToString();
          
          // Return metadata and tags if they exist
          const metadata = response.Metadata;
          const contentType = response.ContentType;
          
          console.log(metadata)
          console.log(response.TagCount)
          // You could return a structured response instead of just the content
          return content;
        } catch (error) {
          throw new Error(`Failed to load object from S3: ${(error as Error).message}`);
        }
    }

    private async moveObject(inputs: S3Operation): Promise<string> {
        if (!inputs.destinationBucket || !inputs.destinationKey) {
          throw new Error('Destination bucket and key are required for move operation');
        }
    
        try {
          // First copy the object to new location
          const copyCommand = new CopyObjectCommand({
            CopySource: `${inputs.bucket}/${inputs.key}`,
            Bucket: inputs.destinationBucket,
            Key: inputs.destinationKey
          });
          await this.s3Client.send(copyCommand);
    
          // Then delete the original object
          const deleteCommand = new DeleteObjectCommand({
            Bucket: inputs.bucket,
            Key: inputs.key
          });
          await this.s3Client.send(deleteCommand);
    
          return `s3://${inputs.destinationBucket}/${inputs.destinationKey}`;
        } catch (error) {
          throw new Error(`Failed to move object: ${(error as Error).message}`);
        }
      }
    
      private async deleteObject(inputs: S3Operation): Promise<string> {
        try {
          const command = new DeleteObjectCommand({
            Bucket: inputs.bucket,
            Key: inputs.key
          });
          
          await this.s3Client.send(command);
          return `Successfully deleted s3://${inputs.bucket}/${inputs.key}`;
        } catch (error) {
          throw new Error(`Failed to delete object: ${(error as Error).message}`);
        }
      }

    private formatTags(tags: Record<string, string>): string {
        return Object.entries(tags)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
      }
    
}
