import * as fs from 'fs/promises';
import * as path from 'path';

export class VirtualFileSystem {
  constructor(private rootDir: string) {}

  async readFile(filePath: string): Promise<Buffer> {
    const fullPath = this.resolvePath(filePath);
    return fs.readFile(fullPath);
  }

  async writeFile(filePath: string, data: Buffer): Promise<void> {
    const fullPath = this.resolvePath(filePath);
    await fs.writeFile(fullPath, data);
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = this.resolvePath(filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async mkdir(dirPath: string): Promise<void> {
    const fullPath = this.resolvePath(dirPath);
    await fs.mkdir(fullPath, { recursive: true });
  }

  private resolvePath(filePath: string): string {
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.startsWith('..') || path.isAbsolute(normalizedPath)) {
      throw new Error('Access denied: Attempting to access outside of virtual file system');
    }
    return path.join(this.rootDir, normalizedPath);
  }
}
