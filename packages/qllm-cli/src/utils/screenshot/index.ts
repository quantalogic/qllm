// File: /Users/raphaelmansuy/Github/03-working/qllm/packages/qllm-cli/src/utils/screenshot/index.ts

import * as os from "os";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { MacOSScreenshotCapture } from "./macos-screenshot-capture";
import { WindowsScreenshotCapture } from "./windows-screenshot-capture";
import { LinuxScreenshotCapture } from "./linux-screenshot-capture";

// Interfaces
export interface ScreenshotCaptureOptions {
  maxRetries?: number;
  retryDelay?: number;
}

export interface CaptureOptions {
  windowName?: string;
  interactive?: boolean;
  fullScreen?: boolean;
  clipboard?: boolean;
  mainMonitorOnly?: boolean;
  displayNumber?: number;
  captureMouseCursor?: boolean;
}

export interface Window {
  name: string;
  id: string;
  app: string;
}

export interface Screen {
  id: string;
  type: string;
  resolution: string;
}

// Interface for ScreenshotCapture implementations
export interface ScreenshotCaptureImpl {
  initialize(): Promise<void>;
  captureAndGetBase64(options: CaptureOptions): Promise<string | null>;
  listWindows(): Promise<Window[]>;
  listScreens(): Promise<Screen[]>;
  cleanupTempDir(): Promise<void>;
}

// Factory function to create ScreenshotCapture instances
function createScreenshotCapture(options: ScreenshotCaptureOptions = {}): ScreenshotCaptureImpl {
  const platform = os.platform();
  switch (platform) {
    case "darwin":
      return new MacOSScreenshotCapture(options);
    case "win32":
      return new WindowsScreenshotCapture(options);
    case "linux":
      return new LinuxScreenshotCapture(options);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

// Facade
export class ScreenshotCapture {
  private implementation: ScreenshotCaptureImpl;

  constructor(options: ScreenshotCaptureOptions = {}) {
    this.implementation = createScreenshotCapture(options);
  }

  async initialize(): Promise<void> {
    return this.implementation.initialize();
  }

  async captureAndGetBase64(options: CaptureOptions = {}): Promise<string | null> {
    return this.implementation.captureAndGetBase64(options);
  }

  async listWindows(): Promise<Window[]> {
    return this.implementation.listWindows();
  }

  async listScreens(): Promise<Screen[]> {
    return this.implementation.listScreens();
  }

  async cleanupTempDir(): Promise<void> {
    return this.implementation.cleanupTempDir();
  }
}

// Utility functions
export function createTempDir(): string {
  const baseDir = os.tmpdir();
  const uniqueDir = `screenshot-capture-${uuidv4()}`;
  return path.join(baseDir, uniqueDir);
}

export async function cleanup(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.warn("Failed to delete temporary file:", error);
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}