import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import screenshot from 'screenshot-desktop';
import { v4 as uuidv4 } from 'uuid';

export class ScreenshotCapture {
  private tempDir: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(maxRetries: number = 3, retryDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
    this.tempDir = this.createTempDir();
  }

  private createTempDir(): string {
    const baseDir = os.tmpdir();
    const uniqueDir = `screenshot-capture-${uuidv4()}`;
    return path.join(baseDir, uniqueDir);
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create temporary directory:', error);
      throw new Error('Failed to initialize ScreenshotCapture');
    }
  }

  async captureAndGetBase64(): Promise<string> {
    let attempts = 0;
    while (attempts < this.maxRetries) {
      try {
        return await this.capture();
      } catch (error) {
        console.warn(`Screenshot capture attempt ${attempts + 1} failed:`, error);
        attempts++;
        if (attempts >= this.maxRetries) {
          throw new Error(`Failed to capture screenshot after ${this.maxRetries} attempts`);
        }
        await this.delay(this.retryDelay);
      }
    }
    throw new Error('Unexpected error in captureAndGetBase64');
  }

  private async capture(): Promise<string> {
    const filename = `screenshot-${Date.now()}.png`;
    const filePath = path.join(this.tempDir, filename);

    try {
      await screenshot({ filename: filePath });
      const imageBuffer = await fs.readFile(filePath);
      const base64Image = imageBuffer.toString('base64');
      return `data:image/png;base64,${base64Image}`;
    } finally {
      await this.cleanup(filePath);
    }
  }

  private async cleanup(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Failed to delete temporary file:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanupTempDir(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      await Promise.all(files.map(file => 
        fs.unlink(path.join(this.tempDir, file))
      ));
      await fs.rmdir(this.tempDir);
    } catch (error) {
      console.error('Error cleaning up temporary directory:', error);
    }
  }
}