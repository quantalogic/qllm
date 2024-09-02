import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import path from 'path';
import { z } from 'zod';
import { PackageManager } from './package-manager';
import { FileManager } from './file-manager';
import { VirtualFileSystem } from './virtual-fs';
import { Sandbox } from '../security/sandbox';
import { ResourceLimiter } from '../security/resource-limiter';
import { Logger } from '../utils/logger';
import { ErrorHandler, EnclaveError } from '../utils/error-handler';
import { EnclaveConfig, FileInput, EnclaveStatus, AITool, ToolSchema } from '../types';
import { AIToolNotFoundError, InvalidParametersError} from "../utils/error-handler"

/**
 * Enclave class for managing AI tool execution environment
 */
export class Enclave extends EventEmitter {
  private id: string;
  private tempDir: string;
  private packageManager: PackageManager;
  private fileManager: FileManager;
  private virtualFs: VirtualFileSystem;
  private sandbox: Sandbox;
  private resourceLimiter: ResourceLimiter;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private status: EnclaveStatus;
  private aiTools: Map<string, AITool<any, any>> = new Map();

  /**
   * Creates a new Enclave instance
   * @param {EnclaveConfig} config - Configuration for the Enclave
   */
  constructor(config: EnclaveConfig) {
    super();
    this.id = uuidv4();
    this.tempDir = "";
    this.packageManager = new PackageManager(this.tempDir, config.cacheDir);
    this.fileManager = new FileManager(this.tempDir);
    this.virtualFs = new VirtualFileSystem(this.tempDir);
    this.sandbox = new Sandbox(config.sandboxConfig, this.tempDir);
    this.resourceLimiter = new ResourceLimiter(config.resourceLimits);
    this.logger = new Logger(config.loggerConfig);
    this.errorHandler = new ErrorHandler();
    this.status = 'initialized';
  }

  /**
   * Registers an AI tool with the Enclave
   * @param {AITool<TParams, TResult>} tool - The AI tool to register
   */
  registerAITool<TParams, TResult>(tool: AITool<TParams, TResult>): void {
    this.aiTools.set(tool.name, tool);
    this.emit('toolRegistered', tool.name);
  }

  /**
   * Executes an AI tool based on the provided schema
   * @param {ToolSchema<TParams>} schema - The schema for the AI tool execution
   * @returns {Promise<TResult>} The result of the AI tool execution
   */
  async executeAITool<TParams, TResult>(schema: ToolSchema<TParams>): Promise<TResult> {
    const tool = this.aiTools.get(schema.tool);
    if (!tool) {
      const error = new AIToolNotFoundError(schema.tool);
      this.emit('error', error);
      throw error;
    }

    try {
      this.emit('toolExecutionStarted', schema.tool);
      const result = await tool.execute(schema.params);
      this.emit('toolExecutionCompleted', schema.tool, result);
      return result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const invalidParamsError = new InvalidParametersError(schema.tool, error.errors.map(e => e.message));
        this.emit('error', invalidParamsError);
        throw invalidParamsError;
      }
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Prepares the Enclave environment
   * @param {FileInput[]} files - Files to be written to the Enclave
   * @param {string[]} packages - Packages to be installed
   */
  async prepare(files: FileInput[], packages: string[]): Promise<void> {
    try {
      this.status = 'preparing';
      this.emit('preparing');
      await this.fileManager.writeFiles(files);
      this.status = 'prepared';
      this.emit('prepared');
    } catch (error) {
      this.status = 'error';
      this.emit('error', error);
      throw this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Executes the main entry file in the Enclave
   * @param {string} entryFile - The main entry file to execute
   * @returns {Promise<any>} The result of the execution
   */
  async execute(entryFile: string): Promise<any> {
    let executionTimeout: NodeJS.Timeout | null = null;
    try {
      this.status = 'executing';
      this.emit('executing');
      executionTimeout = this.resourceLimiter.enforceLimits();
      const code = await this.fileManager.readFile(path.basename(entryFile));
      const schema: ToolSchema<any> = JSON.parse(code);
      const result = await this.executeAITool(schema);
      this.status = 'completed';
      this.emit('completed', result);
      return result;
    } catch (error) {
      this.status = 'error';
      this.emit('error', error);
      throw this.errorHandler.handleError(error as Error);
    } finally {
      if (executionTimeout) {
        clearTimeout(executionTimeout);
      }
      this.resourceLimiter.clearLimits();
      this.resourceLimiter.monitorUsage();
    }
  }

  /**
   * Cleans up the Enclave environment
   */
  async cleanup(): Promise<void> {
    try {
      this.status = 'cleaning';
      this.emit('cleaning');
      await this.fileManager.cleanup();
      await this.packageManager.cleanup();
      this.resourceLimiter.clearLimits();
      this.status = 'cleaned';
      this.emit('cleaned');
    } catch (error) {
      this.status = 'error';
      this.emit('error', error);
      this.logger.error('Cleanup failed', error as Error);
    }
  }

  /**
   * Gets the current status of the Enclave
   * @returns {EnclaveStatus} The current status
   */
  getStatus(): EnclaveStatus {
    return this.status;
  }
}