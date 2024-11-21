// src/tools/s3-loader.tool.ts
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { BaseTool, ToolDefinition } from "./base-tool";

export class S3LoaderTool extends BaseTool {
  private s3Client: S3Client;

  constructor(config: Record<string, any>) {
    super(config);
    this.s3Client = new S3Client(config);
  }

  getDefinition(): ToolDefinition {
    return {
      name: 's3-loader',
      description: 'Loads files from AWS S3',
      input: {
        bucket: { type: 'string', required: true, description: 'S3 bucket name' },
        key: { type: 'string', required: true, description: 'S3 object key' }
      },
      output: { type: 'string', description: 'File content' }
    };
  }

  async execute(inputs: Record<string, any>) {
    const command = new GetObjectCommand({
      Bucket: inputs.bucket,
      Key: inputs.key
    });
    const response = await this.s3Client.send(command);
    return await response.Body?.transformToString();
  }
}
