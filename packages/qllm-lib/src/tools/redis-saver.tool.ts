/**
 * Redis Saver Tool
 * 
 * A tool for saving key-value pairs to Redis with optional expiration.
 * 
 * Installation:
 * ```bash
 * npm install ioredis
 * # or
 * pnpm add ioredis
 * ```
 * 
 * Configuration:
 * - host: Redis host (default: 'localhost')
 * - port: Redis port (default: 6379)
 * - password: Redis password (optional)
 * - db: Redis database number (optional)
 * Example config: { host: 'localhost', port: 6379, password: 'secret' }
 * 
 * Usage example in workflow:
 * ```yaml
 * - tool: redis-saver
 *   input:
 *     config:
 *       host: "{{redis_host}}"
 *       password: "{{redis_password}}"
 *     key: "user:123"
 *     value: "John Doe"
 *     expiration: 3600  # Optional, in seconds
 *   output: "save_status"
 * ```
 * 
 * Features:
 * - Supports both persistent and expiring keys
 * - Automatic connection management
 * - Returns 'OK' on successful operation
 * 
 * Error handling:
 * - Throws if connection fails
 * - Throws if set operation fails
 * - Automatically handles connection pooling
 */

import Redis from "ioredis";
import { BaseTool, ToolDefinition } from "./base-tool";

export class RedisSaverTool extends BaseTool {
    private client: Redis;
  
    constructor(config: Record<string, any>) {
      super(config);
      this.client = new Redis(config);
    }
  
    getDefinition(): ToolDefinition {
      return {
        name: 'redis-saver',
        description: 'Saves content to Redis',
        input: {
          key: { type: 'string', required: true, description: 'Redis key' },
          value: { type: 'string', required: true, description: 'Value to save' },
          expiration: { type: 'number', required: false, description: 'Expiration in seconds' }
        },
        output: { type: 'string', description: 'Operation status' }
      };
    }
  
    async execute(inputs: Record<string, any>) {
      if (inputs.expiration) {
        await this.client.setex(inputs.key, inputs.expiration, inputs.value);
      } else {
        await this.client.set(inputs.key, inputs.value);
      }
      return 'OK';
    }
  }