import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DockerConfig } from '../types';
import { Logger } from '../utils/logger';

const execAsync = promisify(exec);

/**
 * DockerSandbox class manages Docker container operations for project execution.
 */
export class DockerSandbox {
  private readonly logger: Logger;

  /**
   * Creates a new DockerSandbox instance.
   * @param config - Docker configuration options.
   */
  constructor(private readonly config: DockerConfig) {
    this.logger = new Logger({ debugMode: true });
  }

  /**
   * Runs a Docker project with specified parameters.
   * @param projectPath - Path to the Docker project.
   * @param params - Key-value pairs of environment variables.
   * @returns An object containing the output and logs from the execution.
   * @throws Error if the project is invalid or execution fails.
   */
  async run(projectPath: string, params: Record<string, string>): Promise<{ output: string; logs: string }> {
    this.logger.info(`Validating Docker project: ${projectPath}`);
    await this.validateProject(projectPath);

    this.logger.info('Updating .env file with parameters');
    await this.updateEnvFile(projectPath, params);

    this.logger.info('Building and running Docker container');
    const logs = await this.buildAndRun(projectPath);

    const isRunning = await this.checkContainerStatus(projectPath);
    this.logger.info(isRunning ? 'Container is still running. You can access the Flask app.' : 'Container has stopped.');
    
    this.logger.info('Retrieving output');
    const output = await this.getOutput(projectPath);

    return { output, logs };
  }

    /**
   * Builds and runs the Docker container.
   * @param projectPath - Path to the Docker project.
   * @returns Logs from the Docker execution.
   * @throws Error if Docker execution fails.
   */
  private async buildAndRun(projectPath: string): Promise<string> {
    try {
      // Attempt to clean up existing containers and networks
      await this.cleanupDocker();

      this.logger.info('Executing docker-compose up --build');
      const { stdout, stderr } = await execAsync('docker-compose up --build -d', {
        cwd: projectPath,
        timeout: this.config.timeout,
      });

      const logs = stdout + stderr;
      this.logger.debug(`Docker execution output: ${logs}`);
      return logs;
    } catch (error) {
      this.logger.error('Docker execution failed', error as Error);
      throw new Error(`Docker execution failed: ${(error as Error).message}`);
    }
  }

  /**
   * Attempts to clean up Docker containers and networks.
   * Continues execution even if cleanup fails.
   */
  private async cleanupDocker(): Promise<void> {
    try {
      await execAsync('docker rm -f $(docker ps -aq)');
      this.logger.info('Successfully removed all Docker containers');
    } catch (error) {
      this.logger.warn('Failed to remove Docker containers, continuing execution');
    }

    try {
      await execAsync('docker network prune -f');
      this.logger.info('Successfully pruned Docker networks');
    } catch (error) {
      this.logger.warn('Failed to prune Docker networks, continuing execution');
    }
  }
    
  /**
   * Checks if the Docker container is still running.
   * @param projectPath - Path to the Docker project.
   * @returns True if the container is running, false otherwise.
   */
  private async checkContainerStatus(projectPath: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync('docker-compose ps -q', { cwd: projectPath });
      return stdout.trim() !== '';
    } catch (error) {
      this.logger.error('Failed to check container status', error as Error);
      return false;
    }
  }

  /**
   * Validates the Docker project structure.
   * @param projectPath - Path to the Docker project.
   * @throws Error if docker-compose.yml is not found.
   */
  private async validateProject(projectPath: string): Promise<void> {
    const dockerComposePath = path.join(projectPath, 'docker-compose.yml');
    try {
      await fs.access(dockerComposePath);
    } catch {
      throw new Error('Invalid Docker project: docker-compose.yml not found');
    }
  }

  /**
   * Updates the .env file with provided parameters.
   * @param projectPath - Path to the Docker project.
   * @param params - Key-value pairs of environment variables.
   */
  private async updateEnvFile(projectPath: string, params: Record<string, string>): Promise<void> {
    const envPath = path.join(projectPath, '.env');
    const envContent = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    await fs.writeFile(envPath, envContent);
  }

  /**
   * Retrieves the output from the Docker execution.
   * @param projectPath - Path to the Docker project.
   * @returns Content of the output file or a default message if not available.
   */
  private async getOutput(projectPath: string): Promise<string> {
    const outputPath = path.join(projectPath, 'output', 'output.txt');
    try {
      return await fs.readFile(outputPath, 'utf-8');
    } catch (error) {
      this.logger.error('Failed to read output file');
      return 'No output available';
    }
  }
}