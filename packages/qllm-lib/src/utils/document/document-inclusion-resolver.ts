/**
 * @fileoverview Document inclusion resolver that handles file inclusions within documents.
 * Supports recursive file inclusion with circular dependency detection and URL resolution.
 * 
 * Inclusion syntax: {{ include: path/to/file }}
 * Escaped inclusion: \{{ include: path/to/file }}
 * 
 * @author QLLM Team
 * @module utils/document/document-inclusion-resolver
 */

import * as path from 'path';
import { URL } from 'url';
import { DocumentLoader } from './document-loader';

/**
 * Regular expression to match include directives.
 * Captures the path in group 1.
 * Negative lookbehind (?<!\) ensures escaped directives are not matched.
 */
const includeRegex = /(?<!\\){{\s*include:\s*([^}\s]+)\s*}}/g;

/**
 * Type alias for tracking loaded paths to detect circular dependencies.
 */
type LoadedPaths = Set<string>;

/**
 * Loads content from a file with circular dependency detection.
 * 
 * @param {string} inputPath - Path to the file to load
 * @param {string} basePath - Base path for resolving relative paths
 * @param {LoadedPaths} [loadedPaths=new Set()] - Set of already loaded paths
 * @returns {Promise<{content: string; mimeType: string}>} Loaded content and its MIME type
 * @throws {Error} If circular dependency is detected or content loading fails
 * 
 * @example
 * ```typescript
 * const { content, mimeType } = await loadContent('template.md', '/base/path');
 * ```
 */
export async function loadContent(
  inputPath: string,
  basePath: string,
  loadedPaths: LoadedPaths = new Set(),
): Promise<{ content: string; mimeType: string }> {
  const fullPath = resolveFullPath(inputPath, basePath);
  if (loadedPaths.has(fullPath)) {
    throw new Error(`Circular dependency detected: ${fullPath}`);
  }
  loadedPaths.add(fullPath);

  const loader = new DocumentLoader(fullPath);
  const result = await loader.loadAsString();
  if (!result?.content) {
    throw new Error(`Failed to load content for path: ${fullPath}`);
  }
  return result;
}

/**
 * Finds all include statements in the content.
 * Does not process escaped include statements.
 * 
 * @param {string} content - Content to search for include statements
 * @returns {Array<string>} Array of found include statements
 * 
 * @example
 * ```typescript
 * const includes = findIncludeStatements('{{ include: header.md }}\nContent\n{{ include: footer.md }}');
 * // Returns: ['{{ include: header.md }}', '{{ include: footer.md }}']
 * ```
 */
export function findIncludeStatements(content: string): Array<string> {
  const includeStatements = content.match(includeRegex) || [];
  return includeStatements;
}

/**
 * Resolves included content recursively, processing all include directives.
 * Supports optional content transformation before inclusion.
 * 
 * @param {string} content - Content containing include directives
 * @param {string} basePath - Base path for resolving relative paths
 * @param {LoadedPaths} [loadedPaths=new Set()] - Set of already loaded paths
 * @param {Function} [contentTransformBeforeInclude] - Optional transform function
 * @returns {Promise<string>} Content with all includes resolved
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const resolved = await resolveIncludedContent('{{ include: header.md }}', '/base/path');
 * 
 * // With content transformation
 * const resolved = await resolveIncludedContent(
 *   content,
 *   basePath,
 *   new Set(),
 *   async (content, path) => content.toUpperCase()
 * );
 * ```
 */
export async function resolveIncludedContent(
  content: string,
  basePath: string,
  loadedPaths: LoadedPaths = new Set(),
  contentTransformBeforeInclude?: (contentLoaded: string, path: string) => string | Promise<string>,
): Promise<string> {
  content = contentTransformBeforeInclude
    ? await contentTransformBeforeInclude(content, basePath)
    : content;

  let resolvedContent = content;

  const matches = Array.from(content.matchAll(includeRegex));
  for (const match of matches) {
    const [fullMatch, includePath] = match;
    try {
      const trimmedIncludePath = includePath.trim(); // Trim spaces around the filename
      const fullPath = resolveFullPath(trimmedIncludePath, basePath);
      const { content: includedContent } = await loadContent(fullPath, basePath, loadedPaths);
      const recursivelyResolvedContent = await resolveIncludedContent(
        includedContent,
        fullPath,
        loadedPaths,
      );
      resolvedContent = resolvedContent.replace(fullMatch, recursivelyResolvedContent);
    } catch (error) {
      console.warn(
        `Failed to resolve included content: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Remove escape characters and replace escaped include directives
  resolvedContent = resolvedContent.replace(/\\{{include:/g, '{{include:');

  return resolvedContent;
}

/**
 * Resolves a full path from an input path and base path.
 * Handles URLs, file URLs, and relative/absolute paths.
 * 
 * @param {string} inputPath - Input path to resolve
 * @param {string} basePath - Base path for resolution
 * @returns {string} Resolved full path
 * @private
 */
function resolveFullPath(inputPath: string, basePath: string): string {
  if (isUrl(basePath)) return new URL(inputPath, basePath).toString();
  if (isUrl(inputPath)) return inputPath;
  if (isFileUrl(inputPath)) return path.resolve(path.dirname(basePath), fileUrlToPath(inputPath));
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(path.dirname(basePath), inputPath);
}

/**
 * Checks if a path is a URL.
 * 
 * @param {string} input - Path to check
 * @returns {boolean} True if path is a URL
 * @private
 */
function isUrl(input: string): boolean {
  return input.startsWith('http://') || input.startsWith('https://');
}

/**
 * Checks if a path is a file URL.
 * 
 * @param {string} input - Path to check
 * @returns {boolean} True if path is a file URL
 * @private
 */
function isFileUrl(input: string): boolean {
  return input.startsWith('file://');
}

/**
 * Converts a file URL to a local file path.
 * 
 * @param {string} fileUrl - File URL to convert
 * @returns {string} Local file path
 * @private
 */
function fileUrlToPath(fileUrl: string): string {
  return decodeURIComponent(new URL(fileUrl).pathname);
}
