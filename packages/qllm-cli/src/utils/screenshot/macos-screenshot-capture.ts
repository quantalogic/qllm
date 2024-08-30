// macos-screenshot-capture.ts

import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { CaptureOptions, Screen, Window, ScreenshotCapture, ScreenshotCaptureOptions } from "./types";
import { createTempDir, cleanup, delay } from "./utils";

const execAsync = promisify(exec);

export class MacOSScreenshotCapture implements ScreenshotCapture {
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
      throw new Error("Failed to initialize MacOSScreenshotCapture");
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
      let command = `screencapture`;
      if (options.clipboard) {
        command += " -c";
      }
      if (options.interactive) {
        command += " -i";
      } else {
        if (options.mainMonitorOnly || (!options.displayNumber && !options.windowName)) {
          command += " -m";
        }
        if (options.displayNumber) {
          command += ` -D${options.displayNumber}`;
        }
        if (options.captureMouseCursor) {
          command += " -C";
        }
        if (options.windowName) {
          const windowId = await this.getWindowId(options.windowName);
          if (windowId) {
            command += ` -l ${windowId}`;
          } else {
            throw new Error(`Window "${options.windowName}" not found`);
          }
        }
      }
      if (!options.clipboard) {
        command += ` "${filePath}"`;
      }

      await execAsync(command);

      if (options.clipboard) {
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
    const appleScript = `
      tell application "System Events"
        set frontApp to first application process whose frontmost is true
        tell process (name of frontApp)
          set windowId to id of first window whose name contains "${windowName}"
          return windowId
        end tell
      end tell
    `;

    try {
      const { stdout } = await execAsync(`osascript -e '${appleScript}'`);
      return stdout.trim();
    } catch (error) {
      console.error("Failed to get window ID:", error);
      return null;
    }
  }

  async listWindows(): Promise<Window[]> {
    const appleScript = `
      tell application "System Events"
        set windowList to {}
        repeat with proc in (every process whose visible is true)
          set procName to name of proc
          repeat with w in (every window of proc)
            set end of windowList to {name:name of w, id:id of w, app:procName}
          end repeat
        end repeat
        return windowList
      end tell
    `;

    try {
      const { stdout } = await execAsync(`osascript -e '${appleScript}'`);
      const windowsData = stdout
        .trim()
        .split(", {")
        .map((w) => w.replace(/[{}]/g, ""));

      return windowsData.map((windowData) => {
        const [name, id, app] = windowData
          .split(", ")
          .map((item) => item.split(":")[1]);
        return { name, id, app };
      });
    } catch (error) {
      console.error("Failed to list windows:", error);
      return [];
    }
  }

  async listScreens(): Promise<Screen[]> {
    try {
      const { stdout } = await execAsync(
        "system_profiler SPDisplaysDataType -json"
      );
      const data = JSON.parse(stdout);
      const displays = data.SPDisplaysDataType[0].spdisplays_ndrvs;

      return displays.map((display: any, index: number) => ({
        id: (index + 1).toString(),
        type: display._name,
        resolution: `${display._spdisplays_pixels || "Unknown"}`,
      }));
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