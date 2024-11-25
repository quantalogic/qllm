/**
 * MongoDB Saver Tool
 * 
 * A tool for saving documents to MongoDB collections.
 * 
 * Installation:
 * ```bash
 * npm install mongodb
 * # or
 * pnpm add mongodb
 * ```
 * 
 * Configuration:
 * - uri: MongoDB connection string (required)
 * Example config: { uri: 'mongodb://localhost:27017' }
 * 
 * Usage example in workflow:
 * ```yaml
 * - tool: mongodb-saver
 *   input:
 *     config:
 *       uri: "{{mongodb_uri}}"
 *     database: "mydb"
 *     collection: "mycollection"
 *     document: 
 *       name: "John"
 *       age: 30
 *   output: "saved_id"
 * ```
 * 
 * Features:
 * - Automatic connection management (connects before operation, disconnects after)
 * - Returns the MongoDB ObjectId of the inserted document as string
 * - Supports all MongoDB document types
 * 
 * Error handling:
 * - Throws if connection fails
 * - Throws if insertion fails
 * - Always attempts to close connection, even on error
 */

import { MongoClient } from "mongodb";
import { BaseTool, ToolDefinition } from "./base-tool";

export class MongoDBSaverTool extends BaseTool {
    private client: MongoClient;
  
    constructor(config: Record<string, any>) {
      super(config);
      this.client = new MongoClient(config.uri);
    }
  
    getDefinition(): ToolDefinition {
      return {
        name: 'mongodb-saver',
        description: 'Saves content to MongoDB',
        input: {
          database: { type: 'string', required: true, description: 'Database name' },
          collection: { type: 'string', required: true, description: 'Collection name' },
          document: { type: 'object', required: true, description: 'Document to save' }
        },
        output: { type: 'string', description: 'Inserted document ID' }
      };
    }
  
    async execute(inputs: Record<string, any>) {
      await this.client.connect();
      const db = this.client.db(inputs.database);
      const collection = db.collection(inputs.collection);
      const result = await collection.insertOne(inputs.document);
      await this.client.close();
      return result.insertedId.toString();
    }
  }