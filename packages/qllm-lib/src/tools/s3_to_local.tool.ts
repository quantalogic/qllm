import { 
    S3Client, 
    GetObjectCommand,
    GetObjectCommandInput
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { BaseTool, ToolDefinition } from "./base-tool";
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fromEnv } from "@aws-sdk/credential-providers";
import { AwsCredentialIdentity } from "@aws-sdk/types";
import * as crypto from 'crypto';
import { S3Config } from "../types/s3-types";
import dotenv from 'dotenv';
dotenv.config();

interface S3ToLocalInput {
    /** S3 keys string separated by separator */
    keys: string;
    /** S3 bucket name */
    bucket_name: string;
    /** Separator for multiple keys (defaults to comma) */
    separator?: string;
    /** Encryption key for server-side encryption */
    encKey?: string;
    /** Time in milliseconds after which files should be deleted (defaults to 1 hour) */
    cleanupAfter?: number;
    /** Whether to clean up immediately after workflow completion (defaults to true in workflow context) */
    cleanupOnExit?: boolean;
}

/**
 * @class S3ToLocalTool
 * @extends BaseTool
 * @description Tool for downloading files from S3 to local /tmp directory
 */
export class S3ToLocalTool extends BaseTool {
    private s3Client: S3Client;
    private downloadedFiles: Set<string> = new Set();
    private exitCleanupFiles: Set<string> = new Set();

    constructor(config: S3Config) {
        const credentials = config.aws_s3_access_key && config.aws_s3_secret_key 
            ? {
                accessKeyId: config.aws_s3_access_key,
                secretAccessKey: config.aws_s3_secret_key,
              } as AwsCredentialIdentity
            : {
                accessKeyId: process.env.AWS_S3_ACCESS_KEY,
                secretAccessKey: process.env.AWS_S3_SECRET_KEY,
              } as AwsCredentialIdentity;

        const clientConfig = {
            region: config.aws_s3_bucket_region || process.env.AWS_S3_BUCKET_REGION,
            credentials,
            ...(config.aws_s3_endpoint_url && { endpoint: config.aws_s3_endpoint_url }),
            ...(process.env.AWS_S3_ENDPOINT_URL && { endpoint: process.env.AWS_S3_ENDPOINT_URL }),
            requestHandler: new NodeHttpHandler(),
            maxAttempts: 3,
            retryMode: 'standard'
        };
        
        super();
        this.s3Client = new S3Client(clientConfig);

        // Register cleanup on process exit
        process.on('exit', () => {
            this.cleanupExitFiles();
        });

        // Handle interrupts
        process.on('SIGINT', () => {
            console.log('\nCleaning up files marked for exit cleanup...');
            this.cleanupExitFiles();
            process.exit();
        });
    }

    /**
     * @method getDescription
     * @description Returns a description of what the tool does
     * @returns {string} Tool description
     */
    public getDescription(): string {
        return 'Downloads files from S3 to local /tmp directory with unique identifiers.';
    }

    /**
     * @method getDefinition
     * @returns {ToolDefinition} Tool definition object
     * @description Provides the tool's definition including all required parameters
     */
    getDefinition(): ToolDefinition {
        return {
            name: 's3-to-local-tool',
            description: 'Downloads files from S3 to local /tmp directory',
            input: {
                keys: {
                    type: 'string',
                    required: true,
                    description: 'S3 keys string separated by separator'
                },
                bucket_name: {
                    type: 'string',
                    required: true,
                    description: 'S3 bucket name'
                },
                separator: {
                    type: 'string',
                    required: false,
                    description: 'Separator for multiple keys (defaults to comma)'
                },
                encKey: {
                    type: 'string',
                    required: false,
                    description: 'Encryption key for server-side encryption'
                },
                cleanupAfter: {
                    type: 'number',
                    required: false,
                    description: 'Time in milliseconds after which files should be deleted (defaults to 1 hour)'
                },
                cleanupOnExit: {
                    type: 'boolean',
                    required: false,
                    description: 'Whether to clean up immediately after workflow completion (defaults to true in workflow context)'
                }
            },
            output: {
                type: 'string',
                description: 'Path to the unique directory containing downloaded files',
            }
        };
    }

    /**
     * @method cleanupExitFiles
     * @private
     * @description Cleans up files marked for cleanup on exit
     */
    private cleanupExitFiles(): void {
        for (const filePath of this.exitCleanupFiles) {
            try {
                fs.unlinkSync(filePath);
                console.log(`Cleaned up file on exit: ${filePath}`);
            } catch (error) {
                console.error(`Error cleaning up file ${filePath}:`, error);
            }
        }
        this.exitCleanupFiles.clear();
    }

    /**
     * @method scheduleCleanup
     * @private
     * @param {string} filePath - Path to the file to cleanup
     * @param {number} delay - Delay in milliseconds before cleanup
     * @param {boolean} cleanupOnExit - Whether to clean up on exit
     */
    private async scheduleCleanup(filePath: string, delay: number, cleanupOnExit: boolean): Promise<void> {
        // Add file to tracking set
        this.downloadedFiles.add(filePath);
        
        if (cleanupOnExit) {
            this.exitCleanupFiles.add(filePath);
        } else if (delay > 0) {
            setTimeout(async () => {
                try {
                    await fsPromises.unlink(filePath);
                    this.downloadedFiles.delete(filePath);
                    console.log(`Cleaned up file after delay: ${filePath}`);
                } catch (error) {
                    console.error(`Error cleaning up file ${filePath}:`, error);
                }
            }, delay);
        }
    }

    /**
     * @method execute
     * @param {S3ToLocalInput} inputs - Input parameters
     * @returns {Promise<string>} Path to the unique directory containing downloaded files
     */
    async execute(inputs: S3ToLocalInput): Promise<string> {
        const separator = inputs.separator || ',';
        const keys = inputs.keys.split(separator).map(key => key.trim()).filter(key => key.length > 0);
        const cleanupDelay = inputs.cleanupOnExit ? 0 : (inputs.cleanupAfter || 3600000); // Default to 1 hour if not cleaning up on exit
        const cleanupOnExit = inputs.cleanupOnExit ?? true; // Default to true if not specified
        
        // Create the s3_to_local directory with a unique subfolder
        const baseDir = '/tmp/s3_to_local';
        const uniqueDir = path.join(baseDir, uuidv4());
        await fsPromises.mkdir(uniqueDir, { recursive: true });
        
        for (const key of keys) {
            try {
                const fileName = path.basename(key);
                const localPath = path.join(uniqueDir, fileName);

                const commandInput: GetObjectCommandInput = {
                    Bucket: inputs.bucket_name,
                    Key: key
                };

                // Add encryption if encKey is provided
                if (inputs.encKey) {
                    const encKeyBuffer = Buffer.from(inputs.encKey);
                    const md5Hash = crypto.createHash("md5").update(encKeyBuffer).digest("base64");
                    commandInput.SSECustomerAlgorithm = "AES256";
                    commandInput.SSECustomerKey = inputs.encKey;
                    commandInput.SSECustomerKeyMD5 = md5Hash;
                }

                const response = await this.s3Client.send(new GetObjectCommand(commandInput));
                
                if (!response.Body) {
                    throw new Error(`No body in response for key: ${key}`);
                }

                // Convert the readable stream to a buffer
                const chunks: Uint8Array[] = [];
                for await (const chunk of response.Body as any) {
                    chunks.push(chunk);
                }
                const buffer = Buffer.concat(chunks);

                // Write the buffer to the local file
                await fsPromises.writeFile(localPath, buffer);

                // Schedule cleanup for individual files
                await this.scheduleCleanup(localPath, cleanupDelay, cleanupOnExit);
            } catch (error) {
                console.error(`Error downloading file ${key}:`, error);
                throw error;
            }
        }

        return uniqueDir;
    }
}