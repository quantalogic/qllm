# Table of Contents
- src/workflow/index.ts
- src/workflow/workflow-manager.ts
- src/workflow/workflow-executor.ts
- src/tools/html-formatter.tool.ts
- src/tools/slack-streamer.tool.ts
- src/tools/s3-loader.tool.ts
- src/tools/github-loader.ts
- src/tools/file-saver.tool.ts
- src/tools/s3-saver.tool.ts
- src/tools/base-tool.ts
- src/tools/mongodb-saver.tool.ts
- src/tools/redis-saver.tool.ts
- src/tools/text-to-json.ts
- src/tools/local-loader.tool.ts
- src/types/workflow-types.ts

## File: src/workflow/index.ts

- Extension: .ts
- Language: typescript
- Size: 74 bytes
- Created: 2024-11-21 22:50:35
- Modified: 2024-11-21 22:50:35

### Code

```typescript
export * from './workflow-executor';
export * from './workflow-manager'; 

```

## File: src/workflow/workflow-manager.ts

- Extension: .ts
- Language: typescript
- Size: 6019 bytes
- Created: 2024-11-21 22:57:28
- Modified: 2024-11-21 22:57:28

### Code

```typescript
// src/workflow/workflow-manager.ts

import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import { WorkflowExecutor } from './workflow-executor';
import { WorkflowDefinition, WorkflowExecutionResult, WorkflowStep } from '../types/workflow-types';
import { LLMProvider } from '../types';
import { TemplateDefinition, TemplateLoader } from '../templates';
import { BaseTool, ToolDefinition } from "../tools/base-tool"
import { GithubLoaderTool } from '../tools/github-loader';
import { FileSaverTool } from '../tools/file-saver.tool';
import { S3LoaderTool } from '../tools/s3-loader.tool';
import { SlackStreamerTool } from '../tools/slack-streamer.tool';
import { HtmlFormatterTool } from '../tools/html-formatter.tool';
import { LocalLoaderTool } from '../tools/local-loader.tool';
import { MongoDBSaverTool } from '../tools/mongodb-saver.tool';
import { RedisSaverTool } from '../tools/redis-saver.tool';
import { TextToJsonTool } from '../tools/text-to-json';

export class WorkflowManager {
  private workflowExecutor: WorkflowExecutor;
  private workflows: Map<string, WorkflowDefinition>;
  private providers: Record<string, LLMProvider>;
  private templateCache: Map<string, TemplateDefinition>;
  private toolFactories: Map<string, new (...args: any[]) => BaseTool>;

  constructor(
    providers: Record<string, LLMProvider>,
    tools?: Record<string, BaseTool>
  ) {
    this.workflowExecutor = new WorkflowExecutor();
    this.workflows = new Map();
    this.providers = providers;
    this.templateCache = new Map();
    this.toolFactories = new Map();


    // Register default tools
    this.registerToolFactory('githubLoader', GithubLoaderTool);
    this.registerToolFactory('fileSaver', FileSaverTool);
    this.registerToolFactory('s3Loader', S3LoaderTool);
    this.registerToolFactory('slackStreamer', SlackStreamerTool);
    this.registerToolFactory('htmlFormatter', HtmlFormatterTool);
    this.registerToolFactory('localLoader', LocalLoaderTool);
    this.registerToolFactory('MongoDBSaver', MongoDBSaverTool);
    this.registerToolFactory('RedisSaver', RedisSaverTool);
    this.registerToolFactory('TextToJson', TextToJsonTool);
  }
  
  registerToolFactory(name: string, toolClass: new (...args: any[]) => BaseTool): void {
    this.toolFactories.set(name, toolClass);
  }

  private createTool(name: string, config: any): BaseTool {
    const ToolClass = this.toolFactories.get(name);
    if (!ToolClass) {
      throw new Error(`Tool factory "${name}" not found`);
    }
    return new ToolClass(config);
  }

  private async loadTemplateFromUrl(url: string): Promise<TemplateDefinition> {
    if (this.templateCache.has(url)) {
      return this.templateCache.get(url)!;
    }

    const template = await TemplateLoader.load(url);
    this.templateCache.set(url, template);
    return template;
  }
  
  
  async loadWorkflow(workflowDefinition: WorkflowDefinition | string): Promise<void> {
    const workflow = typeof workflowDefinition === 'string' 
      ? await this.loadWorkflowFromYaml(workflowDefinition) 
      : workflowDefinition;
    
    // Validate and register tools from workflow
    for (const step of workflow.steps) {
      if (step.tool) {
        const ToolClass = this.toolFactories.get(step.tool);
        if (!ToolClass) {
          throw new Error(`Tool factory "${step?.tool}" not found`);
        }
        
        // Tool will be instantiated during execution with config from input
        if (!this.toolFactories.has(step.tool)) {
          throw new Error(`Tool factory "${step?.tool}" not registered`);
        }
      }
      
      if (step.templateUrl) {
        const template = await this.loadTemplateFromUrl(step.templateUrl);
        step.template = template;
      }
    }
  
    this.workflows.set(workflow.name, workflow);
  }
  
  private async loadWorkflowFromYaml(path: string): Promise<WorkflowDefinition> {
    let content: string;
    
    if (path.startsWith('http')) {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.statusText}`);
      }
      content = await response.text();
    } else {
      content = await readFile(path, 'utf-8');
    }
    
    const workflow = parse(content) as WorkflowDefinition;
    
    // Validate workflow schema
    if (!workflow.name || !Array.isArray(workflow.steps)) {
      throw new Error('Invalid workflow schema: missing required fields');
    }
    
    return workflow;
  }

  
  async runWorkflow(
    workflowName: string,
    input: Record<string, any>,
    options: {
      onStepStart?: (step: WorkflowStep, index: number) => void;
      onStepComplete?: (step: WorkflowStep, index: number, result: WorkflowExecutionResult) => void;
      onStreamChunk?: (chunk: string) => void;
      onRequestSent?: (request: any) => void;
      onToolExecution?: (toolName: string, input: Record<string, any>) => void;
    } = {}
  ): Promise<Record<string, WorkflowExecutionResult>> {
    const workflow = this.workflows.get(workflowName);
    
    if (!workflow) {
      throw new Error(`Workflow "${workflowName}" not found`);
    }

    // Set up event handlers
    if (options.onStepStart) {
      this.workflowExecutor.on('stepStart', options.onStepStart);
    }
    if (options.onStepComplete) {
      this.workflowExecutor.on('stepComplete', options.onStepComplete);
    }
    if (options.onStreamChunk) {
      this.workflowExecutor.on('streamChunk', options.onStreamChunk);
    }
    if (options.onRequestSent) {
      this.workflowExecutor.on('requestSent', options.onRequestSent);
    }
    if (options.onToolExecution) {
      this.workflowExecutor.on('toolExecution', options.onToolExecution);
    }

    try {
      // Pass toolFactories instead of tool instances
      return await this.workflowExecutor.executeWorkflow(
        workflow,
        this.providers,
        input,
        this.toolFactories
      );
    } finally {
      this.workflowExecutor.removeAllListeners();
    }
  }
}
```

## File: src/workflow/workflow-executor.ts

- Extension: .ts
- Language: typescript
- Size: 7083 bytes
- Created: 2024-11-21 22:57:28
- Modified: 2024-11-21 22:57:28

### Code

```typescript
// src/workflow/workflow-executor.ts

import { EventEmitter } from 'events';
import { TemplateExecutor } from '../templates/template-executor';
import { WorkflowDefinition, WorkflowStep, WorkflowExecutionContext, WorkflowExecutionResult } from '../types/workflow-types';
import { LLMProvider } from '../types';
import { logger } from '../utils/logger';
import { TemplateLoader } from '../templates';
import { BaseTool } from '../tools/base-tool';
import { GithubLoaderTool } from '../tools/github-loader';
import { FileSaverTool } from '../tools/file-saver.tool';
import { S3LoaderTool } from '../tools/s3-loader.tool';
import { SlackStreamerTool } from '../tools/slack-streamer.tool';
import { HtmlFormatterTool } from '../tools/html-formatter.tool';
import { LocalLoaderTool } from '../tools/local-loader.tool';
import { MongoDBSaverTool } from '../tools/mongodb-saver.tool';
import { RedisSaverTool } from '../tools/redis-saver.tool';
import { TextToJsonTool } from '../tools/text-to-json';

export class WorkflowExecutor extends EventEmitter {
  private templateExecutor: TemplateExecutor;
  private toolFactories: Map<string, new (...args: any[]) => BaseTool>;
  private toolInstances: Map<string, BaseTool>;
  
  constructor() {
    super();
    this.templateExecutor = new TemplateExecutor();
    this.setupTemplateExecutorEvents();
    this.toolFactories = new Map();
    this.toolInstances = new Map();
    
    // Register default tool factories
    this.registerToolFactory('githubLoader', GithubLoaderTool);
    this.registerToolFactory('fileSaver', FileSaverTool);
    this.registerToolFactory('s3Loader', S3LoaderTool);
    this.registerToolFactory('slackStreamer', SlackStreamerTool);
    this.registerToolFactory('htmlFormatter', HtmlFormatterTool);
    this.registerToolFactory('localLoader', LocalLoaderTool);
    this.registerToolFactory('MongoDBSaver', MongoDBSaverTool);
    this.registerToolFactory('RedisSaver', RedisSaverTool);
    this.registerToolFactory('TextToJson', TextToJsonTool);
  }


  registerToolFactory(name: string, toolClass: new (...args: any[]) => BaseTool): void {
    this.toolFactories.set(name, toolClass);
  }

  private setupTemplateExecutorEvents() {
    this.templateExecutor.on('streamChunk', (chunk: string) => {
      this.emit('streamChunk', chunk);
    });

    this.templateExecutor.on('requestSent', (request: any) => {
      this.emit('requestSent', request);
    });
  } 

  async executeWorkflow(
    workflow: WorkflowDefinition,
    providers: Record<string, LLMProvider>,
    initialInput: Record<string, any>,
    toolFactories: Map<string, new (...args: any[]) => BaseTool>
  ): Promise<Record<string, WorkflowExecutionResult>> {
    this.toolFactories = toolFactories;
    const context: WorkflowExecutionContext = {
      variables: { ...initialInput },
      results: {}
    };

    logger.info(`Executing workflow: ${workflow.name}`);

    for (const [index, step] of workflow.steps.entries()) {
      this.emit('stepStart', step, index);
      logger.info(`Step ${index + 1}`);
  
      try {
        let executionResult: WorkflowExecutionResult;

        if (step.tool) {
          executionResult = await this.executeToolStep(step, context);
        } else {
          executionResult = await this.executeTemplateStep(step, context, providers, workflow.defaultProvider);
        }
  
        this.storeStepResults(step, executionResult, context);
        this.emit('stepComplete', step, index, executionResult);
        logger.info(`Completed step ${index + 1}`);
  
      } catch (error) {
        this.emit('stepError', step, index, error as Error);
        throw error;
      }
    }
  
    return context.results;
  }

  

  private async executeToolStep(
    step: WorkflowStep, 
    context: WorkflowExecutionContext
  ): Promise<WorkflowExecutionResult> {
    if (!step.tool) {
      throw new Error('Tool name not specified');
    }

    const ToolClass = this.toolFactories.get(step.tool);
    if (!ToolClass) {
      throw new Error(`Tool factory "${step?.tool}" not found`);
    }

    const resolvedInput = await this.resolveStepInputs(step.input || {}, context);
    const tool = new ToolClass(resolvedInput.config || {});
    
    this.emit('toolExecution', step.tool, resolvedInput);
    const result = await tool.execute(resolvedInput);
    
    return {
      response: JSON.stringify(result),
      outputVariables: result
    };
  }

  private async executeTemplateStep(
    step: WorkflowStep,
    context: WorkflowExecutionContext,
    providers: Record<string, LLMProvider>,
    defaultProvider?: string
  ): Promise<WorkflowExecutionResult> {
    if (step.templateUrl && !step.template) {
      step.template = await TemplateLoader.load(step.templateUrl);
    }

    if (!step.template) {
      throw new Error('No template found for step');
    }

    const resolvedInput = await this.resolveStepInputs(step.input || {}, context);
    const provider = providers[step.provider || defaultProvider || ''];

    if (!provider) {
      throw new Error('Provider not found');
    }

    const result = await this.templateExecutor.execute({
      template: step.template,
      provider,
      variables: resolvedInput,
      stream: true
    });

    return {
      response: result.response,
      outputVariables: result.outputVariables
    };
  }

  private storeStepResults(
    step: WorkflowStep,
    executionResult: WorkflowExecutionResult,
    context: WorkflowExecutionContext
  ): void {
    if (typeof step.output === 'string') {
      context.results[step.output] = executionResult;
    } else {
      Object.entries(step.output).forEach(([key, varName]) => {
        if (typeof varName === 'string') {
          context.results[varName] = executionResult.outputVariables[key];
        }
      });
    }
  }

    private resolveTemplateVariables(
      value: string, 
      context: Record<string, any>
    ): string {
      return value.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
        return context[key.trim()] || '';
      });
    }
    // src/workflow/workflow-executor.ts
    private async resolveStepInputs(
      inputs: Record<string, string | number | boolean>,
      context: WorkflowExecutionContext
    ): Promise<Record<string, any>> {
      const resolved: Record<string, any> = {};
    
      for (const [key, value] of Object.entries(inputs)) {
        if (typeof value === 'string') {
          if (value.startsWith('$')) {
            // Handle reference to previous step output
            const varName = value.slice(1);
            resolved[key] = context.results[varName]?.response || 
                           context.results[varName]?.outputVariables || 
                           context.results[varName];
          } else if (value.match(/\{\{.*\}\}/)) {
            // Handle template variables
            resolved[key] = this.resolveTemplateVariables(value, context.variables);
          } else {
            resolved[key] = value;
          }
        } else {
          resolved[key] = value;
        }
      }
    
      return resolved;
    }
}
```

## File: src/tools/html-formatter.tool.ts

- Extension: .ts
- Language: typescript
- Size: 779 bytes
- Created: 2024-11-21 22:57:28
- Modified: 2024-11-21 22:57:28

### Code

```typescript
import { BaseTool, ToolDefinition } from "./base-tool";

export class HtmlFormatterTool extends BaseTool {
  constructor(config: Record<string, any> = {}) {
    super(config);
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'html-formatter',
      description: 'Formats content as HTML',
      input: {
        content: { type: 'string', required: true, description: 'Content to format' },
        template: { type: 'string', required: false, description: 'HTML template' }
      },
      output: { type: 'string', description: 'Formatted HTML content' }
    };
  }

  async execute(inputs: Record<string, any>) {
    const template = inputs.template || '<div class="content">{{content}}</div>';
    return template.replace('{{content}}', inputs.content);
  }
}
```

## File: src/tools/slack-streamer.tool.ts

- Extension: .ts
- Language: typescript
- Size: 1112 bytes
- Created: 2024-11-21 22:57:28
- Modified: 2024-11-21 22:57:28

### Code

```typescript
// src/tools/slack-streamer.tool.ts
import { WebClient } from "@slack/web-api";
import { BaseTool, ToolDefinition } from "./base-tool";

export class SlackStreamerTool extends BaseTool {
  private client: WebClient | null = null;

  getDefinition(): ToolDefinition {
    return {
      name: 'slack-streamer',
      description: 'Streams messages to Slack',
      input: {
        token: { type: 'string', required: true, description: 'Slack Bot Token' },
        channel: { type: 'string', required: true, description: 'Channel ID or name' },
        message: { type: 'string', required: true, description: 'Message content' },
        thread_ts: { type: 'string', required: false, description: 'Thread timestamp' }
      },
      output: { type: 'string', description: 'Message ID' }
    };
  }

  async execute(inputs: Record<string, any>) {
    if (!this.client) {
      this.client = new WebClient(inputs.token);
    }
    const response = await this.client.chat.postMessage({
      channel: inputs.channel,
      text: inputs.message,
      thread_ts: inputs.thread_ts
    });
    return response.ts;
  }
}
```

## File: src/tools/s3-loader.tool.ts

- Extension: .ts
- Language: typescript
- Size: 983 bytes
- Created: 2024-11-21 22:57:28
- Modified: 2024-11-21 22:57:28

### Code

```typescript
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

```

## File: src/tools/github-loader.ts

- Extension: .ts
- Language: typescript
- Size: 1423 bytes
- Created: 2024-11-21 22:57:28
- Modified: 2024-11-21 22:57:28

### Code

```typescript
// src/tools/github-loader.ts
import { Octokit } from '@octokit/rest';
import { BaseTool, ToolDefinition } from './base-tool';

// src/tools/github-loader.tool.ts
export class GithubLoaderTool extends BaseTool {
  private octokit: Octokit;

  constructor(config: Record<string, any>) {
    super(config);
    this.octokit = new Octokit({ auth: config.authToken });
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'github-loader',
      description: 'Loads content from GitHub repositories',
      input: {
        owner: { type: 'string', required: true, description: 'Repository owner' },
        repo: { type: 'string', required: true, description: 'Repository name' },
        path: { type: 'string', required: true, description: 'File path' },
        ref: { type: 'string', required: false, description: 'Git reference' }
      },
      output: { type: 'string', description: 'File content' }
    };
  }


  async execute(inputs: Record<string, any>): Promise<Record<string, any>> {
    const { owner, repo, path, ref } = inputs;

    const response = await this.octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: ref || undefined
    });

    if ('content' in response.data) {
      return {
        content: Buffer.from(response.data.content, 'base64').toString(),
        sha: response.data.sha
      };
    }

    throw new Error('Retrieved content is not a file');
  }
}

```

## File: src/tools/file-saver.tool.ts

- Extension: .ts
- Language: typescript
- Size: 876 bytes
- Created: 2024-11-21 22:57:28
- Modified: 2024-11-21 22:57:28

### Code

```typescript
// src/tools/file-saver.tool.ts
import { writeFile } from "fs/promises";
import { BaseTool, ToolDefinition } from "./base-tool";

export class FileSaverTool extends BaseTool {
  constructor(config: Record<string, any> = {}) {
    super(config);
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'file-saver',
      description: 'Saves content to local file',
      input: {
        path: { type: 'string', required: true, description: 'File path' },
        content: { type: 'string', required: true, description: 'Content to save' },
        encoding: { type: 'string', required: false, description: 'File encoding' }
      },
      output: { type: 'string', description: 'Saved file path' }
    };
  }

  async execute(inputs: Record<string, any>) {
    await writeFile(inputs.path, inputs.content, inputs.encoding || 'utf-8');
    return inputs.path;
  }
}

```

## File: src/tools/s3-saver.tool.ts

- Extension: .ts
- Language: typescript
- Size: 1267 bytes
- Created: 2024-11-21 22:57:28
- Modified: 2024-11-21 22:57:28

### Code

```typescript
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
```

## File: src/tools/base-tool.ts

- Extension: .ts
- Language: typescript
- Size: 463 bytes
- Created: 2024-11-21 22:57:28
- Modified: 2024-11-21 22:57:28

### Code

```typescript
// src/tools/base-tool.ts
export interface ToolDefinition {
  name: string;
  description: string;
  input: Record<string, {
    type: string;
    required: boolean;
    description: string;
  }>;
  output: {
    type: string;
    description: string;
  };
}

export abstract class BaseTool {
  constructor(protected config: Record<string, any> = {}) {}
  abstract execute(inputs: Record<string, any>): Promise<any>;
  abstract getDefinition(): ToolDefinition;
}

```

## File: src/tools/mongodb-saver.tool.ts

- Extension: .ts
- Language: typescript
- Size: 2099 bytes
- Created: 2024-11-21 22:57:28
- Modified: 2024-11-21 22:57:28

### Code

```typescript
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
```

## File: src/tools/redis-saver.tool.ts

- Extension: .ts
- Language: typescript
- Size: 2077 bytes
- Created: 2024-11-21 22:57:28
- Modified: 2024-11-21 22:57:28

### Code

```typescript
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
```

## File: src/tools/text-to-json.ts

- Extension: .ts
- Language: typescript
- Size: 3225 bytes
- Created: 2024-11-21 22:57:28
- Modified: 2024-11-21 22:57:28

### Code

```typescript
/**
 * Text to JSON Converter Tool
 * 
 * A tool that converts various text formats into structured JSON data.
 * 
 * Features:
 * - Auto-detects if input is already valid JSON
 * - Supports structured text conversion with custom schema
 * - Handles CSV-like data with custom separators
 * - Supports both single object and array of objects output
 * - Pretty prints JSON output with proper indentation
 * 
 * Configuration:
 * No specific configuration required. Uses default settings.
 * 
 * Usage examples in workflow:
 * 1. Simple key-value conversion:
 * ```yaml
 * - tool: text-to-json
 *   input:
 *     text: "name: John\nage: 30"
 *   output: "json_result"
 * ```
 * 
 * 2. Structured data with schema:
 * ```yaml
 * - tool: text-to-json
 *   input:
 *     text: "John,30,john@email.com\nJane,25,jane@email.com"
 *     schema:
 *       name: "string"
 *       age: "number"
 *       email: "string"
 *     separator: ","
 *   output: "json_result"
 * ```
 * 
 * Input Formats Supported:
 * - JSON strings
 * - Key-value pairs (name: value)
 * - CSV-like data with custom separators
 * - Line-delimited data
 * 
 * Error Handling:
 * - Validates JSON syntax
 * - Handles malformed input gracefully
 * - Provides clear error messages for invalid schemas
 * - Sanitizes input to prevent JSON injection
 */

import { BaseTool, ToolDefinition } from "./base-tool";

export class TextToJsonTool extends BaseTool {
  constructor(config: Record<string, any> = {}) {
    super(config);
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'text-to-json',
      description: 'Converts text content to JSON format',
      input: {
        text: { type: 'string', required: true, description: 'Text to convert' },
        schema: { type: 'object', required: false, description: 'JSON schema structure' },
        separator: { type: 'string', required: false, description: 'Field separator for structured text' }
      },
      output: { 
        type: 'string', 
        description: 'JSON formatted string' 
      }
    };
  }

  async execute(inputs: Record<string, any>) {
    const { text, schema, separator = ',' } = inputs;

    try {
      // First try to parse as JSON in case it's already JSON
      JSON.parse(text);
      return text;
    } catch {
      // If not JSON, process as structured text
      if (schema) {
        const lines = text.split('\n').filter((line:any) => line.trim());
        const result = lines.map((line:any) => {
          const values = line.split(separator);
          const obj: Record<string, any> = {};
          Object.keys(schema).forEach((key, index) => {
            obj[key] = values[index]?.trim();
          });
          return obj;
        });
        return JSON.stringify(result, null, 2);
      }

      // If no schema, try to create a simple key-value object
      const lines = text.split('\n').filter((line:any) => line.trim());
      const result = lines.reduce((acc: Record<string, string>, line:any) => {
        const [key, ...values] = line.split(separator).map((s:any) => s.trim());
        if (key) {
          acc[key] = values.join(separator);
        }
        return acc;
      }, {});

      return JSON.stringify(result, null, 2);
    }
  }
}
```

## File: src/tools/local-loader.tool.ts

- Extension: .ts
- Language: typescript
- Size: 770 bytes
- Created: 2024-11-21 22:57:28
- Modified: 2024-11-21 22:57:28

### Code

```typescript
import { readFile } from "fs/promises";
import { BaseTool, ToolDefinition } from "./base-tool";

export class LocalLoaderTool extends BaseTool {
  constructor(config: Record<string, any> = {}) {
    super(config);
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'local-loader',
      description: 'Loads files from local filesystem',
      input: {
        path: { type: 'string', required: true, description: 'File path' },
        encoding: { type: 'string', required: false, description: 'File encoding' }
      },
      output: { type: 'string', description: 'File content' }
    };
  }

  async execute(inputs: Record<string, any>) {
    const content = await readFile(inputs.path, inputs.encoding || 'utf-8');
    return content.toString();
  }
}
```

## File: src/types/workflow-types.ts

- Extension: .ts
- Language: typescript
- Size: 779 bytes
- Created: 2024-11-21 22:57:28
- Modified: 2024-11-21 22:57:28

### Code

```typescript
// src/types/workflow-types.ts

import { TemplateDefinition } from '../templates/types';

export interface WorkflowStep {
    template?: TemplateDefinition;
    templateUrl?: string;
    tool?: string;
    toolConfig?: Record<string, any>;  
    provider?: string;
    input?: Record<string, string | number | boolean>;
    output: string | Record<string, string>;
  }

export interface WorkflowDefinition {
    name: string;
    description?: string;
    version?: string;
    defaultProvider?: string;
    steps: WorkflowStep[];
}

export interface WorkflowExecutionResult {
    response: string;
    outputVariables: Record<string, any>;
}

export interface WorkflowExecutionContext {
    variables: Record<string, any>;
    results: Record<string, WorkflowExecutionResult>;
}
```

