// template-loader.ts
import { TemplateDefinitionWithResolvedContent } from './template-schema';
import { TemplateDefinitionBuilder } from './template-definition-builder';
import { loadContent, resolveIncludedContent } from '../utils/document/content-loader';

export class TemplateLoader {
  static async load(inputFilePath: string): Promise<TemplateDefinitionWithResolvedContent> {
    const content = await loadContent(inputFilePath, inputFilePath);
    const builder = getBuilder(content);
    const template = builder.build();
    const resolvedContent = await resolveIncludedContent(template.content, inputFilePath);

    return { ...template, content: resolvedContent };
  }

  static async loadAsBuilder(inputFilePath: string): Promise<TemplateDefinitionBuilder> {
    const content = await loadContent(inputFilePath, inputFilePath);
    const builder = getBuilder(content);
    const resolvedContent = await resolveIncludedContent(builder.build().content, inputFilePath);

    return builder.setResolvedContent(resolvedContent);
  }
}

function getBuilder(content: { mimeType: string; content: string }): TemplateDefinitionBuilder {
  const { mimeType, content: contentString } = content;
  if (mimeType === 'application/json') {
    return TemplateDefinitionBuilder.fromJSON(contentString);
  }
  return TemplateDefinitionBuilder.fromYAML(contentString);
}
