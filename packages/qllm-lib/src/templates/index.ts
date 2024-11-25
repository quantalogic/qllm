/**
 * @fileoverview QLLM Template Module Entry Point
 * 
 * This module serves as the main entry point for the QLLM template system.
 * It exports all template-related functionality including:
 * - Template management and execution
 * - Variable extraction and validation
 * - Type definitions and error classes
 * 
 * @version 1.0.0
 * @module qllm-lib/templates
 * 
 * @example
 * ```typescript
 * import { TemplateManager, TemplateExecutor } from 'qllm-lib/templates';
 * 
 * // Create and initialize a template manager
 * const manager = new TemplateManager({ promptDirectory: './templates' });
 * await manager.init();
 * 
 * // Execute a template
 * const executor = new TemplateExecutor();
 * const result = await executor.execute(template, variables);
 * ```
 */

export * from './output-variable-extractor';
export * from './template-manager';
export * from './template-executor';
export * from './template-loader';
export * from './types';
