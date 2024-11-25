// src/tools/local-project-loader.ts
import { BaseTool, ToolDefinition } from './base-tool';
import { readdir, readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

interface LocalFile {
  path: string;
  name: string;
  size: number;
  extension: string;
  created: string;
  modified: string;
  content?: string;
}

export class LocalProjectLoaderTool extends BaseTool {
  private excludeFolders: string[];
  private excludeExtensions: string[];
  private binaryExtensions: string[];

  constructor(config: Record<string, any>) {
    super(config);
    this.excludeFolders = config.excludeFolders || ['node_modules', '.git', 'dist', 'build'];
    this.excludeExtensions = config.excludeExtensions || [];
    this.binaryExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.ico', '.ttf', '.woff', 
      '.woff2', '.eot', '.svg', '.mp3', '.mp4', '.webm', '.wav', 
      '.ogg', '.pdf', '.zip', '.tar', '.gz', '.7z', '.jar', '.war',
      '.ear', '.class', '.dll', '.exe', '.so', '.dylib'
    ];
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'local-project-loader',
      description: 'Loads content from local project directory',
      input: {
        projectPath: { 
          type: 'string', 
          required: true, 
          description: 'Path to local project directory' 
        },
        excludeFolders: {
          type: 'array',
          required: false,
          description: 'Folders to exclude from processing'
        },
        excludeExtensions: {
          type: 'array',
          required: false,
          description: 'File extensions to exclude from processing'
        }
      },
      output: { 
        type: 'object', 
        description: 'Project contents with file metadata and content' 
      }
    };
  }

  private async getAllFiles(dirPath: string, relativePath: string = ''): Promise<LocalFile[]> {
    const files: LocalFile[] = [];
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relPath = join(relativePath, entry.name);

      if (entry.isDirectory()) {
        if (this.excludeFolders.includes(entry.name)) {
          console.log(`⏭️  Skipping excluded folder: ${entry.name}`);
          continue;
        }
        files.push(...await this.getAllFiles(fullPath, relPath));
      } else {
        const extension = extname(entry.name).toLowerCase();
        if (this.excludeExtensions.includes(extension)) {
          console.log(`⏭️  Skipping excluded extension: ${extension}`);
          continue;
        }

        const stats = await stat(fullPath);
        files.push({
          path: relPath,
          name: entry.name,
          size: stats.size,
          extension: extension,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString()
        });
      }
    }

    return files;
  }

  private async getFileContent(fullPath: string, extension: string): Promise<string> {
    try {
      if (this.isBinaryFile(extension)) {
        return '// Binary file content not shown';
      }

      const content = await readFile(fullPath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`Error reading file ${fullPath}:`, error);
      return `// Error reading file: ${error}`;
    }
  }

  private isBinaryFile(extension: string): boolean {
    return this.binaryExtensions.includes(extension.toLowerCase());
  }

  private getLanguage(extension: string): string {
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.js': 'javascript',
      '.py': 'python',
      '.rb': 'ruby',
      '.java': 'java',
      '.php': 'php',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.md': 'markdown',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.xml': 'xml',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sql': 'sql'
    };

    return languageMap[extension] || extension.replace('.', '');
  }

  private formatFileInfo(file: LocalFile): string {
    const language = this.getLanguage(file.extension);
    
    return `
## File: ${file.path}

- Extension: ${file.extension}
- Language: ${language}
- Size: ${file.size} bytes
- Created: ${file.created}
- Modified: ${file.modified}

### Code

\`\`\`${language}
${file.content || '// No content available'}
\`\`\`
`;
  }

  async execute(inputs: Record<string, any>): Promise<Record<string, any>> {
    try {
      const { 
        projectPath, 
        excludeFolders = [], 
        excludeExtensions = [] 
      } = inputs;

      // Update exclude lists with any additional inputs
      this.excludeFolders = [...new Set([...this.excludeFolders, ...excludeFolders])];
      this.excludeExtensions = [...new Set([...this.excludeExtensions, ...excludeExtensions])];

      console.log(`\n📦 Processing local project: ${projectPath}`);
      console.log('Excluded folders:', this.excludeFolders);
      console.log('Excluded extensions:', this.excludeExtensions);
      
      // Get all files
      const files = await this.getAllFiles(projectPath);

      // Generate output
      let output = `# Project: ${projectPath}\n\n`;
      output += `Generated at: ${new Date().toISOString()}\n\n`;
      output += '# Table of Contents\n';
      files.forEach(file => output += `- ${file.path}\n`);
      output += '\n';

      // Process each file
      let processedFiles = 0;
      for (const file of files) {
        processedFiles++;
        console.log(`📄 [${processedFiles}/${files.length}] Processing: ${file.path}`);
        
        const fullPath = join(projectPath, file.path);
        file.content = await this.getFileContent(fullPath, file.extension);
        output += this.formatFileInfo(file);
      }

      return {
        content: output,
        fileCount: processedFiles,
        totalFiles: files.length,
        excludedFolders: this.excludeFolders,
        excludedExtensions: this.excludeExtensions
      };

    } catch (error) {
      console.error('Error processing local project:', error);
      throw new Error(`Failed to process local project: ${error}`);
    }
  }
}