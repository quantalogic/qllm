import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { BaseTool, ToolDefinition } from "./base-tool";

export class S3SaverTool extends BaseTool {
    private s3Client: S3Client;
  
    constructor(config: Record<string, any>) {
      super(config);
      this.s3Client = new S3Client(config);
    }
  
    getDefinition(): ToolDefinition {
      return {
        name: 's3-saver',
        description: 'Saves content to AWS S3',
        input: {
          bucket: { type: 'string', required: true, description: 'S3 bucket name' },
          key: { type: 'string', required: true, description: 'S3 object key' },
          content: { type: 'string', required: true, description: 'Content to save' },
          contentType: { type: 'string', required: false, description: 'Content type' }
        },
        output: { type: 'string', description: 'S3 object URL' }
      };
    }
  
    async execute(inputs: Record<string, any>) {
      const command = new PutObjectCommand({
        Bucket: inputs.bucket,
        Key: inputs.key,
        Body: inputs.content,
        ContentType: inputs.contentType || 'text/plain'
      });
      await this.s3Client.send(command);
      return `s3://${inputs.bucket}/${inputs.key}`;
    }
  }