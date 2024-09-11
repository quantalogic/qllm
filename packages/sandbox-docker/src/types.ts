
export type ProjectType = 'python_flask' | 'nodejs_express';

export interface DockerConfig {
  // Add any Docker-specific configuration options here
  timeout: number;
}

export interface EnclaveConfig {
    cacheDir: string;
    sandboxConfig: SandboxConfig;
    resourceLimits: ResourceLimits;
    loggerConfig: LoggerConfig;
    dockerConfig: DockerConfig;
  }
  
  export interface FileInput {
    name: string;
    content: string;
  }
  
  export type EnclaveStatus = 'initialized' | 'preparing' | 'prepared' | 'executing' | 'completed' | 'cleaning' | 'cleaned' | 'error';
  
  export interface SandboxConfig {
    rootDir: string;
  }
  
  export interface ResourceLimits {
    maxExecutionTime?: number;
    maxMemory?: number;
  }
  
  export interface ResourceUsageStats {
    executionTime: number;
    maxMemoryUsage: number;
  }
  
  export interface LoggerConfig {
    debugMode: boolean;
  }
  
  export interface DetailedError {
    message: string;
    stack?: string;
    type: string;
    code?: string;
  }