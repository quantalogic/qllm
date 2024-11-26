/**
 * @fileoverview AWS S3 Tool
 * This module provides functionality to interact with AWS S3, supporting operations
 * like upload, download, move, and delete with encryption capabilities.
 * @module s3-tool
 */

import { 
    S3Client, 
    HeadObjectCommand,
    PutObjectCommand, 
    GetObjectCommand,
    CopyObjectCommand,
    DeleteObjectCommand,
    PutObjectCommandInput,
    GetObjectCommandInput,
    HeadObjectCommandOutput,
    NotFound,
    S3ServiceException
} from "@aws-sdk/client-s3";
import { BaseTool, ToolDefinition } from "./base-tool";
import * as crypto from "crypto";
import { DocumentLoader } from '../utils/document/document-loader';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * @interface S3Config
 * @description Configuration options for S3 client
 */
interface S3Config {
    /** AWS access key ID */
    aws_access_key_id: string;
    /** AWS secret access key */
    aws_secret_access_key: string;
    /** AWS region */
    aws_region: string;
    /** Optional AWS endpoint URL for custom endpoints */
    aws_endpoint_url?: string;
    /** Additional S3 client options */
    custom_options?: Record<string, any>;
}

/**
 * @interface S3Operation
 * @description Parameters for S3 operations
 */
interface S3Operation {
    /** S3 bucket name */
    bucket: string;
    /** Object key in the bucket */
    key: string;
    /** Content to upload (for save operations) */
    content?: string;
    /** Content type of the object */
    contentType?: string;
    /** Encryption key for server-side encryption */
    encKey?: string;
    /** Object metadata */
    metadata?: Record<string, string>;
    /** Object tags */
    tags?: Record<string, string>;
    /** Destination bucket for move operations */
    destinationBucket?: string;
    /** Destination key for move operations */
    destinationKey?: string;
}

/**
 * @class S3Tool
 * @extends BaseTool
 * @description A tool for interacting with AWS S3, supporting various operations with encryption capabilities
 */
export class S3Tool extends BaseTool {
    private s3Client: S3Client;

    /**
     * @constructor
     * @param {S3Config} config - Configuration object for the S3 client
     */
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

    /**
     * @method getDefinition
     * @returns {ToolDefinition} Tool definition object containing name, description, input/output specifications
     * @description Provides the tool's definition including all required and optional parameters
     */
    getDefinition(): ToolDefinition {
        return {
            name: 's3-tool',
            description: 'Interacts with AWS S3 for file operations',
            input: {
                operation: {
                    type: 'string',
                    required: true,
                    description: 'The operation to perform (save, load, move, delete)'
                },
                bucket: {
                    type: 'string',
                    required: true,
                    description: 'S3 bucket name'
                },
                key: {
                    type: 'string',
                    required: true,
                    description: 'Object key in the bucket'
                },
                content: {
                    type: 'string',
                    required: false,
                    description: 'Content to save or upload'
                },
                contentType: {
                    type: 'string',
                    required: false,
                    description: 'Content type of the object'
                },
                encKey: {
                    type: 'string',
                    required: false,
                    description: 'Encryption key for server-side encryption'
                },
                metadata: {
                    type: 'object',
                    required: false,
                    description: 'Object metadata'
                },
                tags: {
                    type: 'object',
                    required: false,
                    description: 'Object tags'
                },
                destinationBucket: {
                    type: 'string',
                    required: false,
                    description: 'Destination bucket for move operations'
                },
                destinationKey: {
                    type: 'string',
                    required: false,
                    description: 'Destination key for move operations'
                }
            },
            output: {
                type: 'string',
                description: 'Result of the operation'
            }
        };
    }

    /**
     * @method execute
     * @param {S3Operation & { operation: 'save' | 'load' | 'move' | 'delete' }} inputs - Operation parameters
     * @returns {Promise<string>} Result of the operation
     * @throws {Error} If operation is invalid or fails
     * @description Executes the specified S3 operation
     */
    async execute(inputs: S3Operation & { operation: 'save' | 'load' | 'move' | 'delete' }): Promise<string> {
        try {
            await this.verifyOperation(inputs.operation, inputs.bucket, inputs.key);

            switch (inputs.operation) {
                case 'save':
                    return this.saveObject(inputs);
                case 'load':
                    return this.loadObject(inputs);
                case 'move':
                    return this.moveObject(inputs);
                case 'delete':
                    return this.deleteObject(inputs);
                default:
                    throw new Error(`Unsupported operation: ${inputs.operation}`);
            }
        } catch (error) {
            throw new Error(`S3 operation failed: ${(error as Error).message}`);
        }
    }

    /**
     * @method verifyOperation
     * @private
     * @param {string} operation - Operation to verify
     * @param {string} bucket - S3 bucket name
     * @param {string} key - Object key
     * @throws {Error} If operation parameters are invalid
     * @description Verifies the validity of an S3 operation
     */
    private async verifyOperation(operation: string, bucket: string, key: string): Promise<void> {
        if (!bucket || !key) {
            throw new Error('Both bucket and key must be provided');
        }

        if (!['save', 'load', 'move', 'delete'].includes(operation)) {
            throw new Error(`Invalid operation: ${operation}`);
        }

        try {
            const exists = await this.checkFileExists(bucket, key);
            
            switch (operation) {
                case 'save':
                    if (exists) {
                        throw new Error(`File ${key} already exists in bucket ${bucket}`);
                    }
                    break;
                case 'load':
                case 'move':
                case 'delete':
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

    /**
     * @method checkFileExists
     * @private
     * @param {string} bucket - S3 bucket name
     * @param {string} key - Object key
     * @returns {Promise<boolean>} Whether the file exists
     * @description Checks if a file exists in S3
     */
    private async checkFileExists(bucket: string, key: string): Promise<boolean> {
        try {
            const command = new HeadObjectCommand({
                Bucket: bucket,
                Key: key
            });
            await this.s3Client.send(command);
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
            throw error;
        }
    }

    /**
     * @method saveObject
     * @private
     * @param {S3Operation} inputs - Save operation parameters
     * @returns {Promise<string>} Result of the save operation
     * @description Saves an object to S3 with optional encryption and metadata
     */
    private async saveObject(inputs: S3Operation): Promise<string> {
        if (!inputs.content) {
            throw new Error('Content must be provided for save operation');
        }

        const commandInput: PutObjectCommandInput = {
            Bucket: inputs.bucket,
            Key: inputs.key,
            Body: inputs.content,
            ContentType: inputs.contentType || 'text/plain'
        };

        if (inputs.metadata) {
            commandInput.Metadata = inputs.metadata;
        }

        if (inputs.tags) {
            commandInput.Tagging = this.formatTags(inputs.tags);
        }

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

    /**
     * @method loadObject
     * @private
     * @param {S3Operation} inputs - Load operation parameters
     * @returns {Promise<string>} Content of the loaded object
     * @description Loads an object from S3 with support for encryption
     */
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
            console.log(command)
            console.log("debug load, before send")
            const response = await this.s3Client.send(command);
            console.log("debug load, send passed")
            

            // Create a temporary file path
            const tmpDir = path.join(os.tmpdir(), 'document-loader-s3');
            await fs.mkdir(tmpDir, { recursive: true });
            const tmpFile = path.join(tmpDir, path.basename(inputs.key));

            // Save the stream to a temporary file
            const chunks: Uint8Array[] = [];
            for await (const chunk of response.Body as any) {
              chunks.push(chunk);
            }
            await fs.writeFile(tmpFile, Buffer.concat(chunks));

            console.log("debug load, before parse")
            console.log(tmpFile)

            // Use DocumentLoader to load and parse the content
            const loader = new DocumentLoader(tmpFile);
            console.log("loader passed")
            const result = await loader.loadAsString();
            console.log("result passed")
            
            return result.content;
        } catch (error) {
            throw new Error(`Failed to load object from S3: ${(error as Error).message}`);
        }
    }


    /**
     * @method moveObject
     * @private
     * @param {S3Operation} inputs - Move operation parameters
     * @returns {Promise<string>} Result of the move operation
     * @description Moves an object within or between S3 buckets
     */
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

    /**
     * @method deleteObject
     * @private
     * @param {S3Operation} inputs - Delete operation parameters
     * @returns {Promise<string>} Result of the delete operation
     * @description Deletes an object from S3
     */
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

    /**
     * @method formatTags
     * @private
     * @param {Record<string, string>} tags - Tags to format
     * @returns {string} Formatted tags string
     * @description Formats tags for S3 tagging in URL-encoded format
     */
    private formatTags(tags: Record<string, string>): string {
        return Object.entries(tags)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    }
}
