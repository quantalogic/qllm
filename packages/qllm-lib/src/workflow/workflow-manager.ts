/**
 * @fileoverview Workflow Manager for orchestrating and executing workflow definitions
 * @module workflow/workflow-manager
 */

import { readFile } from 'fs/promises';
import { parse } from 'yaml';
import { WorkflowExecutor } from './workflow-executor';
import { WorkflowDefinition, WorkflowExecutionResult, WorkflowStep } from '../types/workflow-types';
import { LLMProvider } from '../types';
import { TemplateDefinition, TemplateLoader, TemplateLoaderConfig } from '../templates';
import { BaseTool, ToolDefinition } from "../tools/base-tool"
import { GithubLoaderTool } from '../tools/github-loader';
import { GitlabLoaderTool } from '../tools/gitlab-loader';
import { FileSaverTool } from '../tools/file-saver.tool';
import { S3Tool } from '../tools/s3.tool';
import { SlackStreamerTool } from '../tools/slack-streamer.tool';
import { HtmlFormatterTool } from '../tools/html-formatter.tool';
import { LocalLoaderTool } from '../tools/local-loader.tool';
import { MongoDBSaverTool } from '../tools/mongodb-saver.tool';
import { RedisSaverTool } from '../tools/redis-saver.tool';
import { RAGToolWithEmbedding } from '../tools/llamaindex-rag-v1';
import { RAGTool } from '../tools/llamaindex-rag.tool';
import { TextToJsonTool } from '../tools/text-to-json';
import { JiraTool } from '../tools/jira.tool'; 
import { BitbucketLoaderTool } from '../tools/bitbucket-loader';
import { S3ToLocalTool } from '../tools/s3_to_local.tool';
import { RemoveFromLocalTool } from '../tools/remove_from_local.tool';
import { ApiServerCallTool } from '../tools/api-server-call.tool';
import { EnhancedJiraTool } from '../tools/enhanced-jira.tool';
import { CustomApiServerCallTool } from '../tools/custom-api-server-call.tool'; 
import { logger } from '../utils/logger';

/**
 * @class WorkflowManager
 * @description Manages the registration, loading, and execution of workflows
 */
export class WorkflowManager {
  private workflowExecutor: WorkflowExecutor;
  private workflows: Map<string, WorkflowDefinition>;
  private providers: Record<string, LLMProvider>;
  private templateCache: Map<string, TemplateDefinition>;
  private toolFactories: Map<string, new (...args: any[]) => BaseTool>;
  private authConfig?: TemplateLoaderConfig;

  /**
   * @constructor
   * @param {Record<string, LLMProvider>} providers - Map of LLM providers
   * @param {Record<string, BaseTool>} [tools] - Optional map of pre-configured tools
   * @param {TemplateLoaderConfig} [authConfig] - Optional authentication configuration
   */
  constructor(
    providers: Record<string, LLMProvider>,
    tools?: Record<string, BaseTool>,
    authConfig?: TemplateLoaderConfig
  ) {
    logger.info('[WorkflowManager] Initializing workflow manager');
    logger.debug('[WorkflowManager] Configuration:', {
      providersCount: Object.keys(providers).length,
      hasTools: !!tools,
      hasAuthConfig: !!authConfig
    });

    this.workflowExecutor = new WorkflowExecutor(authConfig);
    this.workflows = new Map();
    this.providers = providers;
    this.templateCache = new Map();
    this.toolFactories = new Map();
    this.authConfig = authConfig;

    if (authConfig) {
      logger.debug('[WorkflowManager] Configuring template loader with auth config');
      TemplateLoader.configure(authConfig);
    }

    logger.info('[WorkflowManager] Registering default tools');
    // Register default tools
    this.registerToolFactory('githubLoader', GithubLoaderTool);
    this.registerToolFactory('fileSaver', FileSaverTool);
    this.registerToolFactory('s3', S3Tool);
    this.registerToolFactory('slackStreamer', SlackStreamerTool);
    this.registerToolFactory('htmlFormatter', HtmlFormatterTool);
    this.registerToolFactory('localLoader', LocalLoaderTool);
    this.registerToolFactory('MongoDBSaver', MongoDBSaverTool);
    this.registerToolFactory('RedisSaver', RedisSaverTool);
    this.registerToolFactory('TextToJson', TextToJsonTool);
    this.registerToolFactory('LlamaIndexRAGV1', RAGToolWithEmbedding);
    this.registerToolFactory('RAGToolV2', RAGTool); 
    this.registerToolFactory('JiraTool', JiraTool); 
    this.registerToolFactory('EnhancedJira', EnhancedJiraTool); 
    this.registerToolFactory('s3ToLocal', S3ToLocalTool);
    this.registerToolFactory('removeFromLocal', RemoveFromLocalTool);
    this.registerToolFactory('ApiServerCall', ApiServerCallTool);
    this.registerToolFactory('CustomApiServerCall', CustomApiServerCallTool);
    this.registerToolFactory('gitlabLoader', GitlabLoaderTool);
    this.registerToolFactory('BitbucketLoader', BitbucketLoaderTool);
  }
  
  registerToolFactory(name: string, toolClass: new (...args: any[]) => BaseTool): void {
    logger.debug(`[WorkflowManager] Registering tool factory: ${name}`);
    this.toolFactories.set(name, toolClass);
  }

  /**
   * Creates a tool instance from registered factory
   * @private
   * @param {string} name - The name of the tool to create
   * @param {any} config - Configuration for the tool instance
   * @returns {BaseTool} The created tool instance
   * @throws {Error} If tool factory is not found
   */
  private createTool(name: string, config: any): BaseTool {
    logger.debug(`[WorkflowManager] Creating tool instance: ${name}`, { config });
    
    const ToolClass = this.toolFactories.get(name);
    if (!ToolClass) {
      logger.error(`[WorkflowManager] Tool factory not found: ${name}`);
      throw new Error(`Tool factory "${name}" not found`);
    }

    try {
      const tool = new ToolClass(config);
      logger.debug(`[WorkflowManager] Successfully created tool instance: ${name}`);
      return tool;
    } catch (error) {
      logger.error(`[WorkflowManager] Failed to create tool instance: ${name}`, error);
      throw error;
    }
  }

  /**
   * Loads a workflow definition from either an object or YAML file
   * @param {WorkflowDefinition | string} workflowDefinition - The workflow definition or path to YAML
   * @returns {Promise<void>}
   * @throws {Error} If tool factory is not found or template loading fails
   */
  private async loadTemplateFromUrl(url: string): Promise<TemplateDefinition> {
    logger.debug(`[WorkflowManager] Loading template from URL: ${url}`);

    if (this.templateCache.has(url)) {
      logger.debug(`[WorkflowManager] Template found in cache: ${url}`);
      return this.templateCache.get(url)!;
    }

    try {
      const template = await TemplateLoader.load(url);
      logger.debug(`[WorkflowManager] Successfully loaded template: ${url}`);
      this.templateCache.set(url, template);
      return template;
    } catch (error) {
      logger.error(`[WorkflowManager] Failed to load template: ${url}`, error);
      throw error;
    }
  }
  
  
  /**
   * Loads a workflow definition from a YAML file or URL
   * @private
   * @param {string} path - File path or URL to the YAML workflow definition
   * @returns {Promise<WorkflowDefinition>} The parsed workflow definition
   * @throws {Error} If fetch fails or workflow schema is invalid
   */
  async loadWorkflow(workflowDefinition: WorkflowDefinition | string): Promise<void> {
    logger.info('[WorkflowManager] Loading workflow definition');
    logger.debug('[WorkflowManager] Workflow source:', {
      type: typeof workflowDefinition === 'string' ? 'yaml path' : 'object',
      source: typeof workflowDefinition === 'string' ? workflowDefinition : workflowDefinition.name
    });

    try {
      const workflow = typeof workflowDefinition === 'string' 
        ? await this.loadWorkflowFromYaml(workflowDefinition) 
        : workflowDefinition;
      
      logger.info(`[WorkflowManager] Validating workflow: ${workflow.name}`);
      logger.debug(`[WorkflowManager] Workflow details:`, {
        name: workflow.name,
        stepsCount: workflow.steps.length,
        defaultProvider: workflow.defaultProvider
      });

      // Validate and register tools from workflow
      for (const [index, step] of workflow.steps.entries()) {
        logger.debug(`[WorkflowManager] Validating step ${index + 1}/${workflow.steps.length}:`, {
          tool: step.tool,
          hasTemplate: !!step.template,
          hasTemplateUrl: !!step.templateUrl
        });

        if (step.tool) {
          const ToolClass = this.toolFactories.get(step.tool);
          if (!ToolClass) {
            logger.error(`[WorkflowManager] Tool factory not found: ${step.tool}`);
            throw new Error(`Tool factory "${step?.tool}" not found`);
          }
          
          if (!this.toolFactories.has(step.tool)) {
            logger.error(`[WorkflowManager] Tool factory not registered: ${step.tool}`);
            throw new Error(`Tool factory "${step?.tool}" not registered`);
          }
        }
        
        if (step.templateUrl) {
          logger.debug(`[WorkflowManager] Loading template for step ${index + 1}: ${step.templateUrl}`);
          const template = await this.loadTemplateFromUrl(step.templateUrl);
          step.template = template;
        }
      }
    
      this.workflows.set(workflow.name, workflow);
      logger.info(`[WorkflowManager] Successfully loaded workflow: ${workflow.name}`);
    } catch (error) {
      logger.error('[WorkflowManager] Failed to load workflow:', error);
      throw error;
    }
  }
  
  private async loadWorkflowFromYaml(path: string): Promise<WorkflowDefinition> {
    logger.info(`[WorkflowManager] Loading workflow from YAML: ${path}`);
    let content: string;
    
    try {
      if (path.startsWith('http')) {
        logger.debug(`[WorkflowManager] Loading workflow from URL: ${path}`);
        const headers: Record<string, string> = {
          'Accept': 'application/vnd.github.v3.raw'
        };

        if (this.authConfig) {
          logger.debug('[WorkflowManager] Applying auth configuration to request');
          if (this.authConfig.githubToken && path.includes('github.com')) {
            headers['Authorization'] = `Bearer ${this.authConfig.githubToken}`;
          }
          if (this.authConfig.headers) {
            Object.assign(headers, this.authConfig.headers);
          }
        }

        if (path.includes('github.com') && path.includes('/blob/')) {
          const originalPath = path;
          path = path.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
          logger.debug(`[WorkflowManager] Converted GitHub URL: ${originalPath} -> ${path}`);
        }

        const response = await fetch(path, { headers });
        if (!response.ok) {
          logger.error(`[WorkflowManager] Failed to fetch workflow: ${response.statusText}`);
          throw new Error(`Failed to fetch workflow: ${response.statusText}`);
        }
        content = await response.text();
        logger.debug('[WorkflowManager] Successfully fetched workflow content');
      } else {
        logger.debug(`[WorkflowManager] Loading workflow from file: ${path}`);
        content = await readFile(path, 'utf-8');
      }
      
      const workflow = parse(content) as WorkflowDefinition;
      
      // Validate workflow schema
      if (!workflow.name || !Array.isArray(workflow.steps)) {
        logger.error('[WorkflowManager] Invalid workflow schema:', { 
          hasName: !!workflow.name, 
          hasSteps: Array.isArray(workflow.steps) 
        });
        throw new Error('Invalid workflow schema: missing required fields');
      }
      
      logger.info(`[WorkflowManager] Successfully parsed workflow: ${workflow.name}`);
      logger.debug('[WorkflowManager] Workflow structure:', {
        name: workflow.name,
        stepsCount: workflow.steps.length,
        defaultProvider: workflow.defaultProvider
      });

      return workflow;
    } catch (error) {
      logger.error(`[WorkflowManager] Failed to load workflow from YAML: ${path}`, error);
      throw error;
    }
  }

  /**
   * Executes a loaded workflow with given input and options
   * @param {string} workflowName - Name of the workflow to execute
   * @param {Record<string, any>} input - Input parameters for the workflow
   * @param {Object} options - Execution options and callbacks
   * @param {Function} [options.onStepStart] - Callback when a step starts
   * @param {Function} [options.onStepComplete] - Callback when a step completes
   * @param {Function} [options.onStreamChunk] - Callback for stream chunks
   * @param {Function} [options.onRequestSent] - Callback when requests are sent
   * @param {Function} [options.onToolExecution] - Callback when tools are executed
   * @returns {Promise<Record<string, WorkflowExecutionResult>>} Results of workflow execution
   * @throws {Error} If workflow is not found
   */
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
    logger.info(`[WorkflowManager] Starting workflow execution: ${workflowName}`);
    logger.debug('[WorkflowManager] Workflow input:', input);
    logger.debug('[WorkflowManager] Workflow options:', {
      hasStepStart: !!options.onStepStart,
      hasStepComplete: !!options.onStepComplete,
      hasStreamChunk: !!options.onStreamChunk,
      hasRequestSent: !!options.onRequestSent,
      hasToolExecution: !!options.onToolExecution
    });

    const workflow = this.workflows.get(workflowName);
    
    if (!workflow) {
      logger.error(`[WorkflowManager] Workflow not found: ${workflowName}`);
      throw new Error(`Workflow "${workflowName}" not found`);
    }

    logger.debug('[WorkflowManager] Setting up event handlers');
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
      logger.info(`[WorkflowManager] Executing workflow: ${workflowName}`);
      const results = await this.workflowExecutor.executeWorkflow(
        workflow,
        this.providers,
        input,
        this.toolFactories
      );
      
      logger.info(`[WorkflowManager] Workflow execution completed: ${workflowName}`);
      logger.debug('[WorkflowManager] Workflow results:', {
        resultKeys: Object.keys(results)
      });
      
      return results;
    } catch (error) {
      logger.error(`[WorkflowManager] Workflow execution failed: ${workflowName}`, error);
      throw error;
    } finally {
      logger.debug('[WorkflowManager] Cleaning up event listeners');
      this.workflowExecutor.removeAllListeners();
    }
  }

  /**
   * Updates the authentication configuration for private repositories
   * @param {TemplateLoaderConfig} config - The new authentication configuration
   */
  updateAuthConfig(config: TemplateLoaderConfig): void {
    logger.info('[WorkflowManager] Updating authentication configuration');
    logger.debug('[WorkflowManager] New auth config:', {
      hasGithubToken: !!config.githubToken,
      hasHeaders: !!config.headers,
      headerKeys: config.headers ? Object.keys(config.headers) : []
    });

    this.authConfig = config;
    TemplateLoader.configure(config);
    this.workflowExecutor.updateAuthConfig(config);
    
    logger.info('[WorkflowManager] Authentication configuration updated successfully');
  }
}