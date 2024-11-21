# Table of Contents
- src/workflow/index.ts
- src/workflow/workflow-manager.ts
- src/workflow/workflow-executor.ts

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
- Size: 3355 bytes
- Created: 2024-11-21 16:37:27
- Modified: 2024-11-21 16:37:27

### Code

```typescript
// src/workflow/workflow-manager.ts

import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import { WorkflowExecutor } from './workflow-executor';
import { WorkflowDefinition, WorkflowExecutionResult, WorkflowStep } from '../types/workflow-types';
import { LLMProvider } from '../types';
import { TemplateDefinition, TemplateLoader } from '../templates';

export class WorkflowManager {
  private workflowExecutor: WorkflowExecutor;
  private workflows: Map<string, WorkflowDefinition>;
  private providers: Record<string, LLMProvider>;
  private templateCache: Map<string, TemplateDefinition>;

  constructor(providers: Record<string, LLMProvider>) {
    this.workflowExecutor = new WorkflowExecutor();
    this.workflows = new Map();
    this.providers = providers;
    this.templateCache = new Map();
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
    
    // Load all templates from URLs
    for (const step of workflow.steps) {
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

    try {
      return await this.workflowExecutor.executeWorkflow(
        workflow,
        this.providers,
        input
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
- Size: 4453 bytes
- Created: 2024-11-21 16:28:33
- Modified: 2024-11-21 16:28:33

### Code

```typescript
// src/workflow/workflow-executor.ts

import { EventEmitter } from 'events';
import { TemplateExecutor } from '../templates/template-executor';
import { WorkflowDefinition, WorkflowStep, WorkflowExecutionContext, WorkflowExecutionResult } from '../types/workflow-types';
import { LLMProvider } from '../types';
import { logger } from '../utils/logger';
import { TemplateLoader } from '../templates';

export class WorkflowExecutor extends EventEmitter {
  private templateExecutor: TemplateExecutor;
  
  constructor() {
    super();
    this.templateExecutor = new TemplateExecutor();
    this.setupTemplateExecutorEvents();
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
    initialInput: Record<string, any>
  ): Promise<Record<string, WorkflowExecutionResult>> {
    const context: WorkflowExecutionContext = {
      variables: { ...initialInput },
      results: {}
    };
  
    logger.info(`Executing workflow: ${workflow.name}`);
  
    for (const [index, step] of workflow.steps.entries()) {
      this.emit('stepStart', step, index);
      logger.info(`Step ${index + 1}`);
  
      try {
        // Load template if URL is provided
        if (step.templateUrl && !step.template) {
          const template = await TemplateLoader.load(step.templateUrl);
          step.template = template;
        }
  
        if (!step.template) {
          throw new Error(`No template found for step ${index + 1}`);
        }
  
        const resolvedInput = await this.resolveStepInputs(step.input || {}, context);
        const provider = providers[step.provider || workflow.defaultProvider || ''];
  
        if (!provider) {
          throw new Error(`Provider not found for step ${index + 1}`);
        }
  
        logger.info(`Step ${index + 1} => resolvedInput: ${JSON.stringify(resolvedInput, null, 2)}`);
        
        const result = await this.templateExecutor.execute({
          template: step.template,
          provider,
          variables: resolvedInput,
          stream: true
        });
  
        const executionResult: WorkflowExecutionResult = {
          response: result.response,
          outputVariables: result.outputVariables
        };
  
        // Store step results in context
        if (typeof step.output === 'string') {
          context.results[step.output] = executionResult;
        } else {
          Object.entries(step.output).forEach(([key, varName]) => {
            if (typeof varName === 'string') {
              context.results[varName] = executionResult.outputVariables[key];
            }
          });
        }
  
        this.emit('stepComplete', step, index, executionResult);
        logger.info(`Completed step ${index + 1}`);
  
      } catch (error) {
        this.emit('stepError', step, index, error as Error);
        throw error;
      }
    }
  
    return context.results;
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


// src/types/workflow-types.ts

import { TemplateDefinition } from '../templates/types';

export interface WorkflowStep {
    template?: TemplateDefinition;
    templateUrl?: string;
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