import * as fs from 'fs/promises';
import * as path from 'path';
import { TemplateDefinitionWithResolvedContent, TemplateLoader } from '../templates';

async function demoTemplateLoader(): Promise<void> {
  // Create temporary files for inclusion
  const tempDir = path.join(__dirname, 'temp');
  await fs.mkdir(tempDir, { recursive: true });

  const file1Path = path.join(tempDir, 'include1.md');
  const file2Path = 'include2.md';
  const file3Url = 'https://www.quantalogic.app/';
  const file4Path = path.join(tempDir, 'include4.md');
  const storyPath = path.join(tempDir, 'story.md');

  await fs.writeFile(file1Path, 'This is content from file 1 (full path).');
  await fs.writeFile(path.join(tempDir, file2Path), 'This is content from file 2 (partial path).');
  await fs.writeFile(file4Path, 'This is content from file 4 (file:// syntax).');
  await fs.writeFile(storyPath, 'This is the story formatted using Markdown');

  // Create a temporary template file
  const templateContent = `
name: demo_template
version: '1.0'
description: A demo template with various file inclusions
author: Demo Author
content: >
  Here's the main content.
  {{include:${file1Path}}}
  Here's some content in between.
  {{include:${file2Path}}}
  Now, let's include content from a URL:
  {{include:${file3Url}}}
  Finally, let's include content using file:// syntax:
  {{include:file://${file4Path}}}
  Here's the end of the content.
`;

  const templatePath = path.join(tempDir, 'template.yaml');
  await fs.writeFile(templatePath, templateContent);

  try {
    // Load and resolve the local template
    const localLoader = new TemplateLoader();
    const localResolvedTemplate: TemplateDefinitionWithResolvedContent =
      await TemplateLoader.load(templatePath);

    console.log('Locally Resolved Template:');
    console.dir(localResolvedTemplate, { depth: null });

    // Verify that the included content is resolved in the local template
    if (
      localResolvedTemplate.content.includes('This is content from file 1 (full path).') &&
      localResolvedTemplate.content.includes('This is content from file 2 (partial path).') &&
      localResolvedTemplate.content.includes('Realizing AI: From Concept to Business') &&
      localResolvedTemplate.content.includes('This is content from file 4 (file:// syntax).')
    ) {
      console.log('All file inclusions in the local template were successfully resolved!');
    } else {
      console.log('Some file inclusions in the local template were not resolved correctly.');
    }

    // Load and resolve the template from GitHub

    const githubResolvedTemplate: TemplateDefinitionWithResolvedContent = await TemplateLoader.load(
      'https://raw.githubusercontent.com/quantalogic/qllm/main/prompts/create_story.yaml',
    );

    console.log('GitHub Resolved Template:');
    console.dir(githubResolvedTemplate, { depth: 2 });

    // Verify that the story.md is included in the GitHub template
    if (githubResolvedTemplate.resolved_content?.includes('using Markdown')) {
      console.log('The story.md file was successfully included in the GitHub template!');
    } else {
      console.log('The story.md file was not included correctly in the GitHub template.');
    }
  } catch (error) {
    console.error('Error loading template:', error);
  } finally {
    // Clean up temporary files
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

// Run the demo
demoTemplateLoader().catch(console.error);
