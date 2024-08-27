import * as path from 'path';
import { URL } from 'url';
import { DocumentLoader } from '../utils/document/document-loader';
import { TemplateDefinitionWithResolvedContent } from './template-schema';
import { TemplateDefinitionBuilder } from './template-definition-builder';

export class TemplateLoader {
  private loadedPaths: Set<string> = new Set();

  static async load(inputFilePath: string): Promise<TemplateDefinitionWithResolvedContent> {
    return new TemplateLoader().load(inputFilePath);
  }

  static async loadAsBuilder(inputFilePath: string): Promise<TemplateDefinitionBuilder> {
    return new TemplateLoader().loadAsBuilder(inputFilePath);
  }

  async load(inputFilePath: string): Promise<TemplateDefinitionWithResolvedContent> {
    this.loadedPaths.clear();
    const content = await this.getContent(inputFilePath, inputFilePath);
    const builder = this.getBuilder(content);
    const template = builder.build();
    const resolvedContent = await this.resolveIncludedContent(template.content, inputFilePath);
    
    return { ...template, content: resolvedContent };
  }

  async loadAsBuilder(inputFilePath: string): Promise<TemplateDefinitionBuilder> {
    this.loadedPaths.clear();
    const content = await this.getContent(inputFilePath, inputFilePath);
    const builder = this.getBuilder(content);
    const resolvedContent = await this.resolveIncludedContent(builder.build().content, inputFilePath);
    
    return builder.setResolvedContent(resolvedContent);
  }

  private async getContent(inputPath: string, basePath: string): Promise<{ content: string; mimeType: string }> {
    const fullPath = this.resolveFullPath(inputPath, basePath);
    if (this.loadedPaths.has(fullPath)) {
      throw new Error(`Circular dependency detected: ${fullPath}`);
    }
    this.loadedPaths.add(fullPath);

    const loader = new DocumentLoader(fullPath);
    const result = await loader.loadAsString();
    if (!result?.content) {
      throw new Error(`Failed to load content for path: ${fullPath}`);
    }
    return result;
  }

  private getBuilder(content: { mimeType: string; content: string }): TemplateDefinitionBuilder {
    const { mimeType, content: contentString } = content;
    if (mimeType === 'application/json') {
      return TemplateDefinitionBuilder.fromJSON(contentString);
    }
    return TemplateDefinitionBuilder.fromYAML(contentString);
  }

  private resolveFullPath(inputPath: string, basePath: string): string {
    if (this.isUrl(basePath)) return new URL(inputPath, basePath).toString();
    if (this.isUrl(inputPath)) return inputPath;
    if (this.isFileUrl(inputPath)) return path.resolve(path.dirname(basePath), this.fileUrlToPath(inputPath));
    return path.isAbsolute(inputPath) ? inputPath : path.resolve(path.dirname(basePath), inputPath);
  }

  private isUrl(input: string): boolean {
    return input.startsWith('http://') || input.startsWith('https://');
  }

  private isFileUrl(input: string): boolean {
    return input.startsWith('file://');
  }

  private fileUrlToPath(fileUrl: string): string {
    return decodeURIComponent(new URL(fileUrl).pathname);
  }

  private async resolveIncludedContent(content: string, basePath: string): Promise<string> {
    const includeRegex = /{{include:([^}]+)}}/g;
    let resolvedContent = content;

    for (const match of content.matchAll(includeRegex)) {
      const [fullMatch, includePath] = match;
      try {
        const fullPath = this.resolveFullPath(includePath, basePath);
        const { content: includedContent } = await this.getContent(fullPath, basePath);
        const recursivelyResolvedContent = await this.resolveIncludedContent(includedContent, fullPath);
        resolvedContent = resolvedContent.replace(fullMatch, recursivelyResolvedContent);
      } catch (error) {
        console.warn(`Failed to resolve included content: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return resolvedContent;
  }
}