import * as path from 'path';
import { URL } from 'url';
import { DocumentLoader } from '../utils/document/document-loader';
import { TemplateDefinitionWithResolvedContent } from './template-schema';
import { TemplateDefinitionBuilder } from './template-definition-builder';

export class TemplateLoader {
  private async getContent(inputPath: string, basePath: string) {
    const fullPath = this.resolveFullPath(inputPath, basePath);
    const loader = new DocumentLoader(fullPath);
    const content = await loader.loadAsString();
    if (!content) {
      throw new Error(`Failed to load template content for file: ${fullPath}`);
    }
    return content;
  }

  private getBuilder(content: { mimeType: string; content: string }): TemplateDefinitionBuilder {
    switch (content.mimeType) {
      case 'application/json':
        return TemplateDefinitionBuilder.fromJSON(content.content);
      case 'text/yaml':
        return TemplateDefinitionBuilder.fromYAML(content.content);
      default:
        return TemplateDefinitionBuilder.fromYAML(content.content);
    }
  }

  private resolveFullPath(inputPath: string, basePath: string): string {
    if (this.isUrl(inputPath)) {
      return inputPath; // Return the URL as-is
    } else if (this.isFileUrl(inputPath)) {
      const filePath = this.fileUrlToPath(inputPath);
      return path.resolve(path.dirname(basePath), filePath);
    } else if (path.isAbsolute(inputPath)) {
      return inputPath;
    } else {
      return path.resolve(path.dirname(basePath), inputPath);
    }
  }

  private isUrl(input: string): boolean {
    return input.startsWith('http://') || input.startsWith('https://');
  }

  private isFileUrl(input: string): boolean {
    return input.startsWith('file://');
  }

  private fileUrlToPath(fileUrl: string): string {
    const url = new URL(fileUrl);
    return decodeURIComponent(url.pathname);
  }

  private async resolveIncludedContent(content: string, basePath: string): Promise<string> {
    const includeRegex = /{{include:([^}]+)}}/g;
    let match;
    let resolvedContent = content;

    while ((match = includeRegex.exec(content)) !== null) {
      const [fullMatch, includePath] = match;
      const fullPath = this.resolveFullPath(includePath, basePath);
      const includedContent = await this.getContent(fullPath, basePath);
      resolvedContent = resolvedContent.replace(fullMatch, includedContent.content);
    }

    return resolvedContent;
  }

  static async load(inputFilePath: string): Promise<TemplateDefinitionWithResolvedContent> {
    const loader = new TemplateLoader();
    return loader.load(inputFilePath);
  }

  static async loadAsBuilder(inputFilePath: string): Promise<TemplateDefinitionBuilder> {
    const loader = new TemplateLoader();
    return loader.loadAsBuilder(inputFilePath);
  }

  async load(inputFilePath: string): Promise<TemplateDefinitionWithResolvedContent> {
    const content = await this.getContent(inputFilePath, inputFilePath);
    const builder = this.getBuilder(content);
    const template = builder.build();
    
    const resolvedContent = await this.resolveIncludedContent(template.content, inputFilePath);
    
    return {
      ...template,
      content: resolvedContent,
    };
  }

  async loadAsBuilder(inputFilePath: string): Promise<TemplateDefinitionBuilder> {
    const content = await this.getContent(inputFilePath, inputFilePath);
    const builder = this.getBuilder(content);
    
    const resolvedContent = await this.resolveIncludedContent(builder.build().content, inputFilePath);
    
    return builder.setResolvedContent(resolvedContent);
  }
}