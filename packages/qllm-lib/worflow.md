# Table of Contents
- src/workflow/index.ts
- src/workflow/workflow-manager.ts
- src/workflow/workflow-executor.ts
- src/tools/html-formatter.tool.ts
- src/tools/slack-streamer.tool.ts
- src/tools/s3-loader.tool.ts
- src/tools/github-loader.ts
- src/tools/file-saver.tool.ts
- src/tools/base-tool.ts
- src/tools/local-loader.tool.ts
- src/types/workflow-types.ts

## File: src/workflow/index.ts

- Extension: .ts
- Language: typescript
- Size: 74 bytes
- Created: 2024-11-21 16:19:14
- Modified: 2024-11-21 16:19:14

### Code

```typescript
export * from './workflow-executor';
export * from './workflow-manager'; 

```

## File: src/workflow/workflow-manager.ts

- Extension: .ts
- Language: typescript
- Size: 4066 bytes
- Created: 2024-11-21 17:02:49
- Modified: 2024-11-21 17:02:49

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

export class WorkflowManager {
  private workflowExecutor: WorkflowExecutor;
  private workflows: Map<string, WorkflowDefinition>;
  private providers: Record<string, LLMProvider>;
  private templateCache: Map<string, TemplateDefinition>;
  private tools: Map<string, BaseTool>;

  constructor(
    providers: Record<string, LLMProvider>,
    tools?: Record<string, BaseTool>
  ) {
    this.workflowExecutor = new WorkflowExecutor();
    this.workflows = new Map();
    this.providers = providers;
    this.templateCache = new Map();
    this.tools = new Map(Object.entries(tools || {}));
  }
  
  registerTool(name: string, tool: BaseTool): void {
    this.tools.set(name, tool);
  }

  getTool(name: string): BaseTool | undefined {
    return this.tools.get(name);
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
    
    // Validate tools exist
    for (const step of workflow.steps) {
      if (step.tool && !this.tools.has(step.tool)) {
        throw new Error(`Tool "${step.tool}" not found`);
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
    
    return parse(content) as WorkflowDefinition;
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
      return await this.workflowExecutor.executeWorkflow(
        workflow,
        this.providers,
        input,
        this.tools
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
- Size: 5664 bytes
- Created: 2024-11-21 17:06:26
- Modified: 2024-11-21 17:06:26

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

export class WorkflowExecutor extends EventEmitter {
  private templateExecutor: TemplateExecutor;
  private tools: Map<string, BaseTool>;
  
  constructor() {
    super();
    this.templateExecutor = new TemplateExecutor();
    this.setupTemplateExecutorEvents();
    this.tools = new Map(); // Initialize the tools map
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
    tools: Map<string, BaseTool>
  ): Promise<Record<string, WorkflowExecutionResult>> {
    this.tools = tools;
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
          // Execute tool
          executionResult = await this.executeToolStep(step, context);
        } else {
          // Execute template
          executionResult = await this.executeTemplateStep(step, context, providers, workflow.defaultProvider);
        }
  
        // Store step results in context
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

    const tool = this.tools.get(step.tool);
    if (!tool) {
      throw new Error(`Tool ${step.tool} not found`);
    }

    const resolvedInput = await this.resolveStepInputs(step.input || {}, context);
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
- Size: 796 bytes
- Created: 2024-11-21 18:36:55
- Modified: 2024-11-21 18:36:55

### Code

```typescript
import { BaseTool, ToolDefinition } from "./base-tool";

export class HtmlFormatterTool extends BaseTool {
    getDefinition(): ToolDefinition {
      return {
        name: 'html-formatter',
        description: 'Formats content as HTML',
        input: {
          content: { type: 'string', required: true, description: 'Content to format' },
          template: { type: 'string', required: false, description: 'HTML template' }
        },
        output: {
          html: { type: 'string', description: 'Formatted HTML content' }
        }
      };
    }
  
    async execute(inputs: Record<string, any>) {
      const template = inputs.template || '<div class="content">{{content}}</div>';
      const html = template.replace('{{content}}', inputs.content);
      return { html };
    }
  }
```

## File: src/tools/slack-streamer.tool.ts

- Extension: .ts
- Language: typescript
- Size: 1100 bytes
- Created: 2024-11-21 18:42:37
- Modified: 2024-11-21 18:42:37

### Code

```typescript
import { WebClient } from "@slack/web-api";
import { BaseTool, ToolDefinition } from "./base-tool";

export class SlackStreamerTool extends BaseTool {
    private client: WebClient;
  
    constructor(token: string) {
      super();
      this.client = new WebClient(token);
    }
  
    getDefinition(): ToolDefinition {
      return {
        name: 'slack-streamer',
        description: 'Streams messages to Slack',
        input: {
          channel: { type: 'string', required: true, description: 'Channel ID or name' },
          message: { type: 'string', required: true, description: 'Message content' },
          thread_ts: { type: 'string', required: false, description: 'Thread timestamp' }
        },
        output: {
          messageId: { type: 'string', description: 'Sent message ID' }
        }
      };
    }
  
    async execute(inputs: Record<string, any>) {
      const response = await this.client.chat.postMessage({
        channel: inputs.channel,
        text: inputs.message,
        thread_ts: inputs.thread_ts
      });
      return { messageId: response.ts };
    }
  }
```

## File: src/tools/s3-loader.tool.ts

- Extension: .ts
- Language: typescript
- Size: 1159 bytes
- Created: 2024-11-21 18:42:24
- Modified: 2024-11-21 18:42:24

### Code

```typescript
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { BaseTool, ToolDefinition } from "./base-tool";


export class S3LoaderTool extends BaseTool {
    private s3Client: S3Client;
  
    constructor(config: { region: string, credentials: { accessKeyId: string, secretAccessKey: string } }) {
      super();
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
        output: {
          content: { type: 'string', description: 'File content' }
        }
      };
    }
  
    async execute(inputs: Record<string, any>) {
      const command = new GetObjectCommand({
        Bucket: inputs.bucket, // Capital B for Bucket
        Key: inputs.key       // Capital K for Key
      });
      const response = await this.s3Client.send(command);
      return { content: await response.Body?.transformToString() };
    }
  }
```

## File: src/tools/github-loader.ts

- Extension: .ts
- Language: typescript
- Size: 1699 bytes
- Created: 2024-11-21 17:10:14
- Modified: 2024-11-21 17:10:14

### Code

```typescript
// src/tools/github-loader.ts
import { Octokit } from '@octokit/rest';
import { BaseTool, ToolDefinition } from './base-tool';

export class GithubLoaderTool extends BaseTool {
  private octokit: Octokit;

  constructor(authToken: string) {
    super();
    this.octokit = new Octokit({ auth: authToken });
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'github-loader',
      description: 'Loads content from GitHub repositories',
      input: {
        owner: {
          type: 'string',
          required: true,
          description: 'Repository owner'
        },
        repo: {
          type: 'string',
          required: true,
          description: 'Repository name'
        },
        path: {
          type: 'string',
          required: true,
          description: 'File path in repository'
        },
        ref: {
          type: 'string',
          required: false,
          description: 'Git reference (branch, tag, or commit SHA)'
        }
      },
      output: {
        content: {
          type: 'string',
          description: 'File content'
        },
        sha: {
          type: 'string',
          description: 'File SHA'
        }
      }
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
- Size: 834 bytes
- Created: 2024-11-21 18:36:05
- Modified: 2024-11-21 18:36:05

### Code

```typescript
import { writeFile } from "fs";
import { BaseTool, ToolDefinition } from "./base-tool";

export class FileSaverTool extends BaseTool {
    getDefinition(): ToolDefinition {
      return {
        name: 'file-saver',
        description: 'Saves content to local file',
        input: {
          path: { type: 'string', required: true, description: 'File path' },
          content: { type: 'string', required: true, description: 'Content to save' },
          encoding: { type: 'string', required: false, description: 'File encoding' }
        },
        output: {
          path: { type: 'string', description: 'Saved file path' }
        }
      };
    }
  
    async execute(inputs: Record<string, any>) {
      await writeFile(inputs.path, inputs.content, inputs.encoding || 'utf-8');
      return { path: inputs.path };
    }
  }
```

## File: src/tools/base-tool.ts

- Extension: .ts
- Language: typescript
- Size: 467 bytes
- Created: 2024-11-21 16:57:21
- Modified: 2024-11-21 16:57:21

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
    output: Record<string, {
      type: string;
      description: string;
    }>;
  }
  
  export abstract class BaseTool {
    abstract execute(inputs: Record<string, any>): Promise<Record<string, any>>;
    abstract getDefinition(): ToolDefinition;
  }
```

## File: src/tools/local-loader.tool.ts

- Extension: .ts
- Language: typescript
- Size: 745 bytes
- Created: 2024-11-21 18:35:36
- Modified: 2024-11-21 18:35:36

### Code

```typescript
import { readFile } from "fs";
import { BaseTool, ToolDefinition } from "./base-tool";

export class LocalLoaderTool extends BaseTool {
    getDefinition(): ToolDefinition {
      return {
        name: 'local-loader',
        description: 'Loads files from local filesystem',
        input: {
          path: { type: 'string', required: true, description: 'File path' },
          encoding: { type: 'string', required: false, description: 'File encoding' }
        },
        output: {
          content: { type: 'string', description: 'File content' }
        }
      };
    }
  
    async execute(inputs: Record<string, any>) {
      const content = await readFile(inputs.path, inputs.encoding || 'utf-8');
      return { content };
    }
  }
```

## File: src/types/workflow-types.ts

- Extension: .ts
- Language: typescript
- Size: 740 bytes
- Created: 2024-11-21 17:03:04
- Modified: 2024-11-21 17:03:04

### Code

```typescript
// src/types/workflow-types.ts

import { TemplateDefinition } from '../templates/types';

export interface WorkflowStep {
    template?: TemplateDefinition;
    templateUrl?: string;
    tool?: string; 
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

