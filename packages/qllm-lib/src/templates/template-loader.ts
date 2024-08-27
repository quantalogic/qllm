import { DocumentLoader } from '../utils/document/document-loader';
import { TemplateDefinition } from './template-schema';
import { TemplateDefinitionBuilder } from './template-definition-builder';

export class TemplateLoader {
  private async getContent(inputFilePath: string) {
    const loader = new DocumentLoader(inputFilePath);
    const content = await loader.loadAsString();
    if (!content) {
      throw new Error(`Failed to load template content for file: ${inputFilePath}`);
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

  static async load(inputFilePath: string): Promise<TemplateDefinition> {
    const loader = new TemplateLoader();
    return loader.load(inputFilePath);
  }

  static async loadAsBuilder(inputFilePath: string): Promise<TemplateDefinitionBuilder> {
    const loader = new TemplateLoader();
    return loader.loadAsBuilder(inputFilePath);
  }

  async load(inputFilePath: string): Promise<TemplateDefinition> {
    const content = await this.getContent(inputFilePath);
    return this.getBuilder(content).build();
  }

  async loadAsBuilder(inputFilePath: string): Promise<TemplateDefinitionBuilder> {
    const content = await this.getContent(inputFilePath);
    return this.getBuilder(content);
  }
}
