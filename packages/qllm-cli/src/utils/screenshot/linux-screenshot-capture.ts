// linux-screenshot-capture.ts

import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { CaptureOptions, Screen, Window, ScreenshotCapture, ScreenshotCaptureOptions } from "./types";
import { createTempDir, cleanup, delay } from "./utils";

const execAsync = promisify(exec);

export class LinuxScreenshotCapture implements ScreenshotCapture {
  private tempDir: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(options: ScreenshotCaptureOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 1000;
    this.tempDir = createTempDir();
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create temporary directory:", error);
      throw new Error("Failed to initialize LinuxScreenshotCapture");
    }
  }

  async captureAndGetBase64(options: CaptureOptions): Promise<string | null> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.capture(options);
      } catch (error) {
        console.warn(`Screenshot capture attempt ${attempt} failed:`, error);
        if (attempt === this.maxRetries) {
          throw new Error(`Failed to capture screenshot after ${this.maxRetries} attempts`);
        }
        await delay(this.retryDelay);
      }
    }
    throw new Error("Unexpected error in captureAndGetBase64");
  }

  private async capture(options: CaptureOptions): Promise<string | null> {
    const filename = `screenshot-${Date.now()}.png`;
    const filePath = path.join(this.tempDir, filename);

    try {
      let command = "import";

      if (options.windowName) {
        const windowId = await this.getWindowId(options.windowName);
        if (windowId) {
          command += ` -window ${windowId}`;
        } else {
          throw new Error(`Window "${options.windowName}" not found`);
        }
      } else if (options.displayNumber) {
        command += ` -display :0.${options.displayNumber - 1}`;
      }

      if (options.captureMouseCursor) {
        command += " -screen";
      }

      command += ` "${filePath}"`;

      await execAsync(command);

      if (options.clipboard) {
        await execAsync(`xclip -selection clipboard -t image/png -i "${filePath}"`);
        console.log("Screenshot captured to clipboard");
        return null;
      } else {
        const imageBuffer = await fs.readFile(filePath);
        return `data:image/png;base64,${imageBuffer.toString("base64")}`;
      }
    } finally {
      if (!options.clipboard) {
        await cleanup(filePath);
      }
    }
  }

  private async getWindowId(windowName: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`xdotool search --name "${windowName}"`);
      return stdout.trim();
    } catch (error) {
      console.error("Failed to get window ID:", error);
      return null;
    }
  }

  async listWindows(): Promise<Window[]> {
    try {
      const { stdout } = await execAsync(`wmctrl -l -p`);
      const windowLines = stdout.trim().split('\n');
      return windowLines.map(line => {
        const [id, , , app, ...nameParts] = line.split(/\s+/);
        return {
          name: nameParts.join(' '),
          id,
          app,
        };
      });
    } catch (error) {
      console.error("Failed to list windows:", error);
      return [];
    }
  }

  async listScreens(): Promise<Screen[]> {
    try {
      const { stdout } = await execAsync(`xrandr --query`);
      const screenLines = stdout.trim().split('\n').filter(line => line.includes(' connected '));
      return screenLines.map((line, index) => {
        const [name, , resolution] = line.split(/\s+/);
        return {
          id: (index + 1).toString(),
          type: name,
          resolution,
        };
      });
    } catch (error) {
      console.error("Failed to list screens:", error);
      return [];
    }
  }

  async cleanupTempDir(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      await Promise.all(
        files.map((file) => fs.unlink(path.join(this.tempDir, file)))
      );
      await fs.rmdir(this.tempDir);
    } catch (error) {
      console.error("Error cleaning up temporary directory:", error);
    }
  }
}