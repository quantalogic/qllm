import { v4 as uuidv4 } from 'uuid';
import { PackageManager } from './package-manager';
import { FileManager } from './file-manager';
import { VirtualFileSystem } from './virtual-fs'; 
import { ResourceLimiter } from '../security/resource-limiter';
import { Logger } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';
import { EnclaveConfig, FileInput, EnclaveStatus } from '../types';
import { DockerSandbox } from '../security/docker-sandbox';

/**
 * Enclave class represents a secure execution environment for Node.js projects.
 */
export class Enclave {
  private readonly id: string;
  private readonly tempDir: string;
  private readonly packageManager: PackageManager;
  private readonly fileManager: FileManager;
  private readonly virtualFs: VirtualFileSystem; 
  private readonly resourceLimiter: ResourceLimiter;
  private readonly logger: Logger;
  private readonly errorHandler: ErrorHandler;
  private readonly dockerSandbox: DockerSandbox;
  private status: EnclaveStatus;

  /**
   * Creates a new Enclave instance.
   * @param config - Configuration options for the enclave.
   */
  constructor(config: EnclaveConfig) {
    this.id = uuidv4();
    this.tempDir = `/tmp/secure-nodejs-enclave-${this.id}`;
    this.packageManager = new PackageManager(this.tempDir, config.cacheDir);
    this.fileManager = new FileManager(this.tempDir);
    this.virtualFs = new VirtualFileSystem(this.tempDir); 
    this.resourceLimiter = new ResourceLimiter(config.resourceLimits);
    this.logger = new Logger(config.loggerConfig);
    this.errorHandler = new ErrorHandler();
    this.dockerSandbox = new DockerSandbox(config.dockerConfig);
    this.status = 'initialized';
  }

  /**
   * Executes a Docker container with the specified project and parameters.
   * @param projectPath - Path to the project to be executed.
   * @param params - Key-value pairs of parameters for the execution.
   * @returns An object containing the output and logs from the execution.
   * @throws Error if the execution fails.
   */
  async executeDocker(projectPath: string, params: Record<string, string>): Promise<{ output: string; logs: string }> {
    this.status = 'executing';
    this.logger.info(`Starting Docker execution for project: ${projectPath}`);
    this.logger.debug(`Params: ${JSON.stringify(params)}`);

    try {
      const result = await this.dockerSandbox.run(projectPath, params);
      this.logger.info('Docker execution completed successfully');
      this.status = 'completed';
      return result;
    } catch (error) {
      this.status = 'error';
      this.logger.error('Docker execution failed', error as Error);
      throw this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Prepares the enclave by writing files and installing packages.
   * @param files - Array of file inputs to be written.
   * @param packages - Array of package names to be installed.
   * @throws Error if preparation fails.
   */
  async prepare(files: FileInput[], packages: string[]): Promise<void> {
    this.status = 'preparing';
    try {
      await Promise.all([
        this.fileManager.writeFiles(files)
      ]);
      this.status = 'prepared';
    } catch (error) {
      this.status = 'error';
      throw this.errorHandler.handleError(error as Error);
    }
  }

  /**
   * Cleans up resources used by the enclave.
   */
  async cleanup(): Promise<void> {
    this.status = 'cleaning';
    try {
      await Promise.all([
        this.fileManager.cleanup(),
        this.packageManager.cleanup()
      ]);
      this.status = 'cleaned';
    } catch (error) {
      this.status = 'error';
      this.logger.error('Cleanup failed', error as Error);
    }
  }

  /**
   * Gets the current status of the enclave.
   * @returns The current status of the enclave.
   */
  getStatus(): EnclaveStatus {
    return this.status;
  }
}