// windows-screenshot-capture.ts

import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import {
    CaptureOptions,
    Screen,
    Window,
    ScreenshotCapture,
    ScreenshotCaptureOptions,
} from "./types";
import { createTempDir, cleanup, delay } from "./utils";

const execAsync = promisify(exec);

export class WindowsScreenshotCapture implements ScreenshotCapture {
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
            throw new Error("Failed to initialize WindowsScreenshotCapture");
        }
    }

    async captureAndGetBase64(options: CaptureOptions): Promise<string | null> {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await this.capture(options);
            } catch (error) {
                console.warn(
                    `Screenshot capture attempt ${attempt} failed:`,
                    error,
                );
                if (attempt === this.maxRetries) {
                    throw new Error(
                        `Failed to capture screenshot after ${this.maxRetries} attempts`,
                    );
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
            let command = `powershell -command "Add-Type -AssemblyName System.Windows.Forms,System.Drawing; `;

            if (options.windowName) {
                command += `$window = (Get-Process | Where-Object {$_.MainWindowTitle -like '*${options.windowName}*'} | Select-Object -First 1).MainWindowHandle; `;
                command += `$rect = New-Object System.Drawing.Rectangle; [System.Windows.Forms.Screen]::FromHandle($window).Bounds.CopyTo($rect); `;
            } else if (options.displayNumber) {
                command += `$rect = [System.Windows.Forms.Screen]::AllScreens[${options.displayNumber - 1}].Bounds; `;
            } else {
                command += `$rect = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; `;
            }

            command += `$bmp = New-Object System.Drawing.Bitmap $rect.Width, $rect.Height; `;
            command += `$graphics = [System.Drawing.Graphics]::FromImage($bmp); `;
            command += `$graphics.CopyFromScreen($rect.Location, [System.Drawing.Point]::Empty, $rect.Size); `;
            command += `$bmp.Save('${filePath}'); `;
            command += `$graphics.Dispose(); $bmp.Dispose();"`;

            await execAsync(command);

            if (options.clipboard) {
                await execAsync(
                    `powershell -command "Set-Clipboard -Path '${filePath}'"`,
                );
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

    async listWindows(): Promise<Window[]> {
        const command = `powershell -command "Get-Process | Where-Object {$_.MainWindowTitle} | Select-Object Id, Name, MainWindowTitle | ConvertTo-Json"`;
        try {
            const { stdout } = await execAsync(command);
            const windowsData = JSON.parse(stdout);
            return windowsData.map((window: any) => ({
                name: window.MainWindowTitle,
                id: window.Id.toString(),
                app: window.Name,
            }));
        } catch (error) {
            console.error("Failed to list windows:", error);
            return [];
        }
    }

    async listScreens(): Promise<Screen[]> {
        const command = `powershell -command "[System.Windows.Forms.Screen]::AllScreens | Select-Object DeviceName, Bounds | ConvertTo-Json"`;
        try {
            const { stdout } = await execAsync(command);
            const screensData = JSON.parse(stdout);
            return screensData.map((screen: any, index: number) => ({
                id: (index + 1).toString(),
                type: screen.DeviceName,
                resolution: `${screen.Bounds.Width}x${screen.Bounds.Height}`,
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
                files.map((file) => fs.unlink(path.join(this.tempDir, file))),
            );
            await fs.rmdir(this.tempDir);
        } catch (error) {
            console.error("Error cleaning up temporary directory:", error);
        }
    }
}
