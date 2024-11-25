/**
 * @fileoverview Configuration constants for the Anthropic provider.
 * Defines default values for AWS Bedrock integration and model settings.
 * 
 * @author QLLM Team
 * @version 1.0.0
 */

/** Default AWS region for Bedrock service */
export const DEFAULT_AWS_BEDROCK_REGION = 'us-west-2';

/** Default AWS profile name for Bedrock service */
export const DEFAULT_AWS_BEDROCK_PROFILE = 'bedrock';

/** Default Anthropic model identifier */
export const DEFAULT_MODEL = 'anthropic.claude-3-haiku-20240307-v1:0';

/** Default maximum tokens for model responses (128K tokens) */
export const DEFAULT_MAX_TOKENS = 128 * 1024; // 128,000 tokens
