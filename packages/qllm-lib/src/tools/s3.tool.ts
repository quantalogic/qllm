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
    DeleteObjectCommandInput,
    HeadObjectCommandOutput,
    NotFound,
    S3ServiceException
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { BaseTool, ToolDefinition } from "./base-tool";
import * as crypto from "crypto";
import { DocumentLoader } from '../utils/document/document-loader';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { fromEnv } from "@aws-sdk/credential-providers";
import { AwsCredentialIdentity } from "@aws-sdk/types";


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
    key: string | string[];
    /** Local file path (for save operations) */
    filePath?: string | string[];
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
    /** Optional separator for multiple files */
    separator?: string;
    /** Operation to perform (saveMultiple, loadMultiple, move, deleteMultiple, save, load, delete) */
    operation: 'saveMultiple' | 'loadMultiple' | 'move' | 'deleteMultiple' | 'save' | 'load' | 'delete';
}

/**
 * @class S3Tool
 * @extends BaseTool
 * @description A tool for interacting with AWS S3, supporting various operations with encryption capabilities
 */
class S3Tool extends BaseTool {
    private s3Client: S3Client;

    /**
     * @constructor
     * @param {S3Config} config - Configuration object for the S3 client
     */
    constructor(config: S3Config) {
        const credentials = config.aws_access_key_id && config.aws_secret_access_key 
            ? {
                accessKeyId: config.aws_access_key_id,
                secretAccessKey: config.aws_secret_access_key,
              } as AwsCredentialIdentity
            : fromEnv();

        const clientConfig = {
            region: config.aws_region || process.env.AWS_REGION,
            credentials,
            ...(config.aws_endpoint_url && { endpoint: config.aws_endpoint_url }),
            ...config.custom_options,
            requestHandler: new NodeHttpHandler(),
            maxAttempts: 3,
            retryMode: 'standard'
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
                    description: 'The operation to perform (saveMultiple, loadMultiple, move, deleteMultiple, save, load, delete)'
                },
                bucket: {
                    type: 'string',
                    required: true,
                    description: 'S3 bucket name'
                },
                key: {
                    type: 'string | string[]',
                    required: true,
                    description: 'Object key(s) in the bucket'
                },
                filePath:{
                    type: 'string | string[]',
                    required: false,
                    description: 'Local file path(s)'
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
                },
                separator: {
                    type: 'string',
                    required: false,
                    description: 'Separator to use between multiple files (defaults to two newlines)'
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
     * @param {S3Operation} inputs - Operation parameters
     * @returns {Promise<string>} Result of the operation
     * @throws {Error} If operation is invalid or fails
     * @description Executes the specified S3 operation
     */
    async execute(inputs: S3Operation): Promise<string> {
        try {
            await this.verifyOperation(inputs.operation, inputs.bucket, inputs.key);

            switch (inputs.operation) {
                case 'saveMultiple':
                    return this.saveObjects(inputs);
                case 'loadMultiple':
                    return this.loadObjects(inputs);
                case 'move':
                    return this.moveObject(inputs);
                case 'deleteMultiple':
                    return this.deleteObjects(inputs);
                case 'save':
                    return this.saveObject(inputs);
                case 'load':
                    return this.loadObject(inputs);
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
     * @param {string | string[]} key - Object key(s)
     * @throws {Error} If operation parameters are invalid
     * @description Verifies the validity of an S3 operation
     */
    private async verifyOperation(operation: string, bucket: string, key: string | string[]): Promise<void> {
        if (!bucket) {
            throw new Error('bucket must be provided');
        }
        if (!key) {
            throw new Error('key must be provided');
        }

        const multiOperations = ['saveMultiple', 'loadMultiple', 'deleteMultiple'];
        const singleOperations = ['save', 'load', 'delete', 'move'];

        if (![...multiOperations, ...singleOperations].includes(operation)) {
            throw new Error(`Invalid operation: ${operation}`);
        }

        if (multiOperations.includes(operation) && !Array.isArray(key)) {
            throw new Error(`${operation} operation requires an array of keys`);
        }

        if (singleOperations.includes(operation) && Array.isArray(key)) {
            throw new Error(`${operation} operation requires a single key string`);
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
     * @method saveObjects
     * @private
     * @param {S3Operation} inputs - Save operation parameters with array of keys and file paths
     * @returns {Promise<string>} Result of the save operation
     * @description Saves multiple files to S3 using streaming upload
     */
    private async saveObjects(inputs: S3Operation): Promise<string> {
        if (!Array.isArray(inputs.key)) {
            throw new Error('saveObjects requires an array of keys');
        }

        if (!Array.isArray(inputs.filePath)) {
            throw new Error('saveObjects requires an array of filePaths');
        }

        if (inputs.key.length !== inputs.filePath.length) {
            throw new Error('Number of keys must match number of filePaths');
        }

        const results: string[] = [];
        for (let i = 0; i < inputs.key.length; i++) {
            const key = inputs.key[i];
            const filePath = inputs.filePath[i];

            const commandInput: PutObjectCommandInput = {
                Bucket: inputs.bucket,
                Key: key,
                Body: createReadStream(filePath),
            };

            if (inputs.metadata) {
                commandInput.Metadata = inputs.metadata;
            }

            if (inputs.tags) {
                commandInput.Tagging = this.formatTags(inputs.tags);
            }

            try {
                const command = new PutObjectCommand(commandInput);
                await this.s3Client.send(command);
                results.push(`Successfully saved file ${filePath} to ${inputs.bucket}/${key}`);
            } catch (error) {
                results.push(`Failed to save file ${filePath} to ${inputs.bucket}/${key}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        return results.join('\n');
    }

    /**
     * @method loadObjects
     * @private
     * @param {S3Operation} inputs - Load operation parameters with array of keys
     * @returns {Promise<string>} Concatenated content of all loaded objects
     * @description Loads one or multiple objects from S3, processes them with DocumentLoader, and concatenates them with a separator
     */
    private async loadObjects(inputs: S3Operation): Promise<string> {
        if (!Array.isArray(inputs.key)) {
            throw new Error('loadObjects requires an array of keys');
        }

        const separator = inputs.separator || '\n\n';
        const tmpDir = path.join(os.tmpdir(), 'document-loader-s3');
        await fs.mkdir(tmpDir, { recursive: true });

        // Download all files to temporary directory
        const tmpFiles: string[] = [];
        for (const key of inputs.key) {
            const commandInput: GetObjectCommandInput = {
                Bucket: inputs.bucket,
                Key: key
            };

            if (inputs.encKey) {
                const encKeyBuffer = Buffer.from(inputs.encKey);
                const md5Hash = crypto.createHash("md5").update(encKeyBuffer).digest("base64");
                commandInput.SSECustomerAlgorithm = "AES256";
                commandInput.SSECustomerKey = inputs.encKey;
                commandInput.SSECustomerKeyMD5 = md5Hash;
            }

            const command = new GetObjectCommand(commandInput);
            const response = await this.s3Client.send(command);
            
            const tmpFile = path.join(tmpDir, path.basename(key));
            const chunks: Uint8Array[] = [];
            for await (const chunk of response.Body as any) {
                chunks.push(chunk);
            }
            await fs.writeFile(tmpFile, Buffer.concat(chunks));
            tmpFiles.push(tmpFile);
        }

        // Use DocumentLoader to load all files
        const results = await DocumentLoader.loadMultipleAsString(tmpFiles);

        // Concatenate all results with separator
        return results.map(result => result.parsedContent).join(separator);
    }

    /**
     * @method loadObject
     * @private
     * @param {S3Operation} inputs - Load operation parameters with single key
     * @returns {Promise<string>} Content of the loaded object
     * @description Loads an object from S3, processes it with DocumentLoader
     */
    private async loadObject(inputs: S3Operation): Promise<string> {
        if (Array.isArray(inputs.key)) {
            throw new Error('loadObject requires a single key');
        }

        const tmpDir = path.join(os.tmpdir(), 'document-loader-s3');
        await fs.mkdir(tmpDir, { recursive: true });

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
        console.log("Command Input:");
        console.log(commandInput);
        const command = new GetObjectCommand(commandInput);
        console.log("Command:");
        console.log(command);   
        const response = await this.s3Client.send(command);
             
        // Save to temporary file
        const tmpFile = path.join(tmpDir, path.basename(inputs.key));
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as any) {
            chunks.push(chunk);
        }
        await fs.writeFile(tmpFile, Buffer.concat(chunks));

        // Use DocumentLoader to load the file
        const result = await DocumentLoader.quickLoadString(tmpFile);
        return result.parsedContent || result.content;
    }

    /**
     * @method saveObject
     * @private
     * @param {S3Operation} inputs - Save operation parameters with single key
     * @returns {Promise<string>} Result of the save operation
     * @description Saves a single file to S3
     */
    private async saveObject(inputs: S3Operation): Promise<string> {
        if (Array.isArray(inputs.key)) {
            throw new Error('saveObject requires a single key');
        }

        if (!inputs.filePath && !inputs.content) {
            throw new Error('Either filePath or content must be provided');
        }

        if (inputs.filePath && Array.isArray(inputs.filePath)) {
            throw new Error('saveObject requires a single filePath');
        }

        let localFilePath: string | undefined = inputs.filePath as string;

        try {
            // Create temp directory if it doesn't exist
            const tmpDir = path.join(os.tmpdir(), 'qllm-s3-tool');
            await fs.mkdir(tmpDir, { recursive: true });

            // If content is provided, save it locally first
            if (inputs.content) {
                const ext = path.extname(inputs.key) || this.getFileExtension(inputs.contentType);
                localFilePath = path.join(tmpDir, `${uuidv4()}${ext}`);
                await fs.writeFile(localFilePath, inputs.content, 'utf-8');
            }

            if (!localFilePath) {
                throw new Error('No valid file path available for upload');
            }

            const commandInput: PutObjectCommandInput = {
                Bucket: inputs.bucket,
                Key: inputs.key,
                Body: createReadStream(localFilePath),
                ContentType: inputs.contentType
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

            const command = new PutObjectCommand(commandInput);
            await this.s3Client.send(command);

            // Clean up temp file if we created one
            if (inputs.content && localFilePath !== inputs.filePath) {
                await fs.unlink(localFilePath);
            }

            const source = inputs.content ? 'content' : inputs.filePath;
            return `Successfully saved ${source} to ${inputs.bucket}/${inputs.key}`;
        } catch (error) {
            // Clean up temp file if we created one and an error occurred
            if (inputs.content && localFilePath && localFilePath !== inputs.filePath) {
                try {
                    await fs.unlink(localFilePath);
                } catch (cleanupError) {
                    console.warn('Failed to clean up temporary file:', cleanupError);
                }
            }
            const source = inputs.content ? 'content' : inputs.filePath;
            throw new Error(`Failed to save ${source} to ${inputs.bucket}/${inputs.key}: ${(error as Error).message}`);
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
                Key: inputs.key as string
            });
            await this.s3Client.send(deleteCommand);

            return `s3://${inputs.destinationBucket}/${inputs.destinationKey}`;
        } catch (error) {
            throw new Error(`Failed to move object: ${(error as Error).message}`);
        }
    }

    /**
     * @method deleteObjects
     * @private
     * @param {S3Operation} inputs - Delete operation parameters with array of keys
     * @returns {Promise<string>} Result of the delete operation
     * @description Deletes multiple objects from S3
     */
    private async deleteObjects(inputs: S3Operation): Promise<string> {
        if (!Array.isArray(inputs.key)) {
            throw new Error('deleteObjects requires an array of keys');
        }

        const results: string[] = [];
        for (const key of inputs.key) {
            try {
                const command = new DeleteObjectCommand({
                    Bucket: inputs.bucket,
                    Key: key
                });
                await this.s3Client.send(command);
                results.push(`Successfully deleted: ${key}`);
            } catch (error) {
                results.push(`Failed to delete ${key}: ${(error as Error).message}`);
            }
        }

        return results.join('\n');
    }

    /**
     * @method deleteObject
     * @private
     * @param {S3Operation} inputs - Delete operation parameters with single key
     * @returns {Promise<string>} Result of the delete operation
     * @description Deletes a single object from S3
     */
    private async deleteObject(inputs: S3Operation): Promise<string> {
        if (Array.isArray(inputs.key)) {
            throw new Error('deleteObject requires a single key');
        }

        try {
            const command = new DeleteObjectCommand({
                Bucket: inputs.bucket,
                Key: inputs.key
            });
            await this.s3Client.send(command);
            return `Successfully deleted: ${inputs.key}`;
        } catch (error) {
            throw new Error(`Failed to delete ${inputs.key}: ${(error as Error).message}`);
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

    /**
     * @method getFileExtension
     * @private
     * @param {string | undefined} contentType - MIME type of the content
     * @returns {string} File extension including the dot
     * @description Determines file extension based on content type
     */
    private getFileExtension(contentType?: string): string {
        if (!contentType) return '';
        
        const extensionMap: Record<string, string> = {
            'text/plain': '.txt',
            'application/json': '.json',
            'text/markdown': '.md',
            'text/yaml': '.yaml',
            'application/yaml': '.yaml',
            'application/pdf': '.pdf',
            'text/javascript': '.js',
            'application/javascript': '.js',
            'text/typescript': '.ts',
            'application/x-typescript': '.ts',
            'text/python': '.py',
            'text/x-python': '.py'
        };

        return extensionMap[contentType] || '';
    }
}

export { S3Tool };
