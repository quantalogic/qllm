import { Enclave } from './core/enclave';
import { Logger } from './utils/logger';

async function runDockerProject(projectPath: string, inputValue: string) {
  const logger = new Logger({ debugMode: true });
  logger.info(`Starting Docker project execution: ${projectPath}`);

  const enclave = new Enclave({
    cacheDir: './cache',
    sandboxConfig: { rootDir: './sandbox' },
    resourceLimits: {
      maxExecutionTime: 30000,
      maxMemory: 100 * 1024 * 1024,
    },
    loggerConfig: { debugMode: true },
    dockerConfig: { timeout: 300000 }, // 5 minutes,
  });

  const params = {
    INPUT_VALUE: inputValue,
  };

  try {
    logger.info(`Executing Docker project: ${projectPath}`);
    const { output, logs } = await enclave.executeDocker(projectPath, params);

    logger.info('Build and execution logs:');
    console.log(logs);

    logger.info('Execution result:');
    console.log(output);

    // Extract the port number from the logs (if applicable)
    const portMatch = logs.match(/Running on http:\/\/0\.0\.0\.0:(\d+)/);
    if (portMatch) {
      const port = portMatch[1];
      logger.info(`Application is running on port ${port}`);
    }
  } catch (error) {
    logger.error('Execution failed:', error as Error);
  } finally {
    logger.info('Cleaning up enclave');
    await enclave.cleanup();
  }
}

// Usage
runDockerProject('./example/nodejs-project', 'Hello, From docker!');
// python-project 
// nodejs-project
// python-flask
