
/**
 * Interface for AI tools
 * @template TParams Type of parameters the tool accepts
 * @template TResult Type of result the tool produces
 */
export interface AITool<TParams, TResult> {
  name: string;
  description: string;
  execute: (params: TParams) => Promise<TResult>;
}

/**
 * Interface for tool schema
 * @template TParams Type of parameters the tool accepts
 */
export interface ToolSchema<TParams> {
  tool: string;
  params: TParams;
}

/**
 * Interface for Enclave configuration
 */
export interface EnclaveConfig {
  cacheDir: string;
  sandboxConfig: SandboxConfig;
  resourceLimits: ResourceLimits;
  loggerConfig: LoggerConfig;
}

/**
 * Interface for file input
 */
export interface FileInput {
  name: string;
  content: string;
}

/**
 * Type for Enclave status
 */
export type EnclaveStatus = 'initialized' | 'preparing' | 'prepared' | 'executing' | 'completed' | 'cleaning' | 'cleaned' | 'error';

/**
 * Interface for sandbox configuration
 */
export interface SandboxConfig {
  rootDir: string;
}

/**
 * Interface for resource limits
 */
export interface ResourceLimits {
  maxExecutionTime?: number;
  maxMemory?: number;
}

/**
 * Interface for resource usage statistics
 */
export interface ResourceUsageStats {
  executionTime: number;
  maxMemoryUsage: number;
}

/**
 * Interface for logger configuration
 */
export interface LoggerConfig {
  debugMode: boolean;
}

/**
 * Type for Enclave error codes
 */
export type EnclaveErrorCode = 'RESOURCE_LIMIT_EXCEEDED' | 'ACCESS_DENIED' | 'SYNTAX_ERROR' | 'TYPE_ERROR' | 'UNKNOWN_ERROR';

/**
 * Interface for detailed error information
 */
export interface DetailedError {
  message: string;
  stack?: string;
  type: string;
  code: EnclaveErrorCode;
  timestamp: string;
}