import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import screenshot from 'screenshot-desktop';
import { v4 as uuidv4 } from 'uuid';

// Define our own ScreenshotOptions interface
interface ScreenshotOptions {
  filename?: string;
  screen?: number;
}

export interface ScreenshotCaptureOptions {
  maxRetries?: number;
  retryDelay?: number;
  defaultScreen?: number;
}

export class ScreenshotCapture {
  private readonly tempDir: string;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly defaultScreen?: number;

  constructor(options: ScreenshotCaptureOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000;
    this.defaultScreen = options.defaultScreen;
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

  async captureAndGetBase64(screen?: number): Promise<string> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.capture(screen ? screen : undefined);
      } catch (error) {
        console.warn(`Screenshot capture attempt ${attempt} failed:`, error);
        if (attempt === this.maxRetries) {
          throw new Error(`Failed to capture screenshot after ${this.maxRetries} attempts`);
        }
        await this.delay(this.retryDelay);
      }
    }
    throw new Error('Unexpected error in captureAndGetBase64');
  }

  private async capture(screen?: number): Promise<string> {
    const filename = `screenshot-${Date.now()}.png`;
    const filePath = path.join(this.tempDir, filename);

    try {
      const options: ScreenshotOptions = { filename: filePath };
      if (screen !== undefined) {
        options.screen = screen;
      } else if (this.defaultScreen !== undefined) {
        options.screen = this.defaultScreen;
      }

      await screenshot(options);
      const imageBuffer = await fs.readFile(filePath);
      return `data:image/png;base64,${imageBuffer.toString('base64')}`;
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

  static async getScreensInfo() {
    return screenshot.listDisplays();
  }
}