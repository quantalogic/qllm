// content-loader.ts
import * as path from 'path';
import { URL } from 'url';
import { DocumentLoader } from './document-loader';

const includeRegex = /(?<!\\){{\s*include:\s*([^}\s]+)\s*}}/g;

type LoadedPaths = Set<string>;

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

export function findIncludeStatements(content: string): Array<string> {
  const includeStatements = content.match(includeRegex) || [];
  return includeStatements;
}

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

function resolveFullPath(inputPath: string, basePath: string): string {
  if (isUrl(basePath)) return new URL(inputPath, basePath).toString();
  if (isUrl(inputPath)) return inputPath;
  if (isFileUrl(inputPath)) return path.resolve(path.dirname(basePath), fileUrlToPath(inputPath));
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(path.dirname(basePath), inputPath);
}

function isUrl(input: string): boolean {
  return input.startsWith('http://') || input.startsWith('https://');
}

function isFileUrl(input: string): boolean {
  return input.startsWith('file://');
}

function fileUrlToPath(fileUrl: string): string {
  return decodeURIComponent(new URL(fileUrl).pathname);
}
