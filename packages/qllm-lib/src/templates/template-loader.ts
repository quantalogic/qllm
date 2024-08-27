import * as path from 'path';
import { URL } from 'url';
import { DocumentLoader } from '../utils/document/document-loader';
import { TemplateDefinitionWithResolvedContent } from './template-schema';
import { TemplateDefinitionBuilder } from './template-definition-builder';

export class TemplateLoader {
  private async getContent(inputPath: string, basePath: string): Promise<{ content: string; mimeType: string }> {
    try {
      const fullPath = this.resolveFullPath(inputPath, basePath);
      const loader = new DocumentLoader(fullPath);
      const result = await loader.loadAsString();
      if (!result || !result.content) {
        throw new Error(`Failed to load content for path: ${fullPath}`);
      }
      return result;
    } catch (error) {
      throw new Error(`Error loading content from ${inputPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getBuilder(content: { mimeType: string; content: string }): TemplateDefinitionBuilder {
    try {
      switch (content.mimeType) {
        case 'application/json':
          return TemplateDefinitionBuilder.fromJSON(content.content);
        case 'text/yaml':
        case 'application/x-yaml':
          return TemplateDefinitionBuilder.fromYAML(content.content);
        default:
          return TemplateDefinitionBuilder.fromYAML(content.content);
      }
    } catch (error) {
      throw new Error(`Error creating TemplateDefinitionBuilder: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private resolveFullPath(inputPath: string, basePath: string): string {
    try {
      if (this.isUrl(basePath)) {
        return new URL(inputPath, basePath).toString();
      } else if (this.isUrl(inputPath)) {
        return inputPath;
      } else if (this.isFileUrl(inputPath)) {
        const filePath = this.fileUrlToPath(inputPath);
        return path.resolve(path.dirname(basePath), filePath);
      } else if (path.isAbsolute(inputPath)) {
        return inputPath;
      } else {
        return path.resolve(path.dirname(basePath), inputPath);
      }
    } catch (error) {
      throw new Error(`Error resolving full path for ${inputPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private isUrl(input: string): boolean {
    return input.startsWith('http://') || input.startsWith('https://');
  }

  private isFileUrl(input: string): boolean {
    return input.startsWith('file://');
  }

  private fileUrlToPath(fileUrl: string): string {
    try {
      const url = new URL(fileUrl);
      return decodeURIComponent(url.pathname);
    } catch (error) {
      throw new Error(`Invalid file URL: ${fileUrl}`);
    }
  }

  private async resolveIncludedContent(content: string, basePath: string): Promise<string> {
    const includeRegex = /{{include:([^}]+)}}/g;
    let match;
    let resolvedContent = content;

    while ((match = includeRegex.exec(content)) !== null) {
      try {
        const [fullMatch, includePath] = match;
        const fullPath = this.resolveFullPath(includePath, basePath);
        const includedContent = await this.getContent(fullPath, basePath);
        resolvedContent = resolvedContent.replace(fullMatch, includedContent.content);
      } catch (error) {
        console.warn(`Failed to resolve included content: ${error instanceof Error ? error.message : String(error)}`);
        // Optionally, you can replace the include directive with an error message
        // resolvedContent = resolvedContent.replace(fullMatch, `[Error: Failed to include ${includePath}]`);
      }
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
    try {
      const content = await this.getContent(inputFilePath, inputFilePath);
      const builder = this.getBuilder(content);
      const template = builder.build();
      
      const resolvedContent = await this.resolveIncludedContent(template.content, inputFilePath);
      
      return {
        ...template,
        resolved_content: resolvedContent,
      };
    } catch (error) {
      throw new Error(`Error loading template from ${inputFilePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async loadAsBuilder(inputFilePath: string): Promise<TemplateDefinitionBuilder> {
    try {
      const content = await this.getContent(inputFilePath, inputFilePath);
      const builder = this.getBuilder(content);
      
      const resolvedContent = await this.resolveIncludedContent(builder.build().content, inputFilePath);
      
      return builder.setResolvedContent(resolvedContent);
    } catch (error) {
      throw new Error(`Error loading template as builder from ${inputFilePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}