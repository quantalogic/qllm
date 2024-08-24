import { LLMProvider } from 'qllm-lib';

/** Options for the ask command */
export interface AskOptions {
  /** The LLM provider to use */
  provider: string;
  /** The specific model to use */
  model: string;
  /** Maximum number of tokens to generate */
  maxTokens: number;
  /** Temperature for response generation */
  temperature: number;
  /** Whether to stream the response */
  stream: boolean;
  /** Output file for the response */
  output?: string;
  /** System message to prepend to the conversation */
  systemMessage?: string;
  /** Array of image paths or URLs */
  image: string[];
  /** Whether to use clipboard for image input */
  useClipboard: boolean;
}

/** Configuration for the ask command */
export interface AskConfig {
  /** Default provider to use */
  defaultProvider: string;
  /** Default model to use */
  defaultModel: string;
  /** Default maximum tokens */
  defaultMaxTokens: number;
  /** Default temperature */
  defaultTemperature: number;
  /** Default setting for using clipboard */
  defaultUseClipboard: boolean;
}

/** Context for executing the ask command */
export interface AskContext {
  /** The question to ask */
  question: string;
  /** Options for the ask command */
  options: AskOptions;
  /** The LLM provider instance */
  provider: LLMProvider;
  /** Configuration for the ask command */
  config: AskConfig;
}

/** Result of the ask command execution */
export interface AskResult {
  /** The generated response */
  response: string;
  /** The model used for generation */
  model: string;
  /** Usage statistics */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** Function type for executing the ask command */
export type AskExecutor = (context: AskContext) => Promise<AskResult>;

/** Function type for saving the response to a file */
export type ResponseSaver = (response: string, outputPath: string) => Promise<void>;