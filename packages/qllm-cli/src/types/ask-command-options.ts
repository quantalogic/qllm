import { LLMProvider } from "qllm-lib";
import { z } from "zod";

/** Base Zod schema for the ask command options */
const BaseAskCommandOptionsSchema = z.object({
    /** Maximum number of tokens to generate */
    maxTokens: z.number().int().positive().optional(),

    /** Temperature for response generation */
    temperature: z.number().min(0).max(1).optional(),

    /** Whether to stream the response */
    noStream: z.boolean().optional(),

    /** Output file for the response */
    output: z.string().optional(),

    /** System message to prepend to the conversation */
    systemMessage: z.string().optional(),

    /** Array of image paths, URLs, or 'screenshot' */
    image: z.array(z.string()).optional(),

    /** Whether to use clipboard for image input */
    useClipboard: z.boolean().optional(),

    /** Display number for screenshot capture */
    screenshot: z.number().int().optional(),
});

export const AskCommandOptionsPartialSchema =
    BaseAskCommandOptionsSchema.extend({
        provider: z.string().optional(), // LLM provider to use
        model: z.string().optional(), // Specific model to use
    });

export const AskCommandOptionsSchema = BaseAskCommandOptionsSchema.extend({
    provider: z.string(), // LLM provider to use
    model: z.string(), // Specific model to use
});

export type AskCommandOptions = z.infer<typeof AskCommandOptionsSchema>;

export type PartialAskCommandOptions = z.infer<
    typeof AskCommandOptionsPartialSchema
>;

/** Configuration for the ask command */
export interface AskConfig {
    /** Default provider to use */
    provider: string;

    /** Default model to use */
    model: string;

    /** Default maximum tokens */
    defaultMaxTokens: number;

    /** Default temperature */
    defaultTemperature: number;

    /** Default setting for using clipboard */
    defaultUseClipboard: boolean;

    /** Default display number for screenshot capture */
    defaultScreenshotDisplay?: number;
}

/** Context for executing the ask command */
export interface AskContext {
    /** The question to ask */
    question: string;

    /** Options for the ask command */
    options: AskCommandOptions;

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
export type ResponseSaver = (
    response: string,
    outputPath: string,
) => Promise<void>;

/** Function type for preparing image inputs */
export type ImageInputPreparer = (
    options: AskCommandOptions,
) => Promise<string[]>;

/** Function type for creating message content */
export type MessageContentCreator = (question: string, images: string[]) => any;

/** Function type for capturing a screenshot */
export type ScreenshotCapturer = (display?: number) => Promise<string>;

/** Function type for formatting file sizes */
export type BytesFormatter = (bytes: number) => string;
