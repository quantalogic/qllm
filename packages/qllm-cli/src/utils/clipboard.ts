// src/utils/clipboard.ts

import { execSync, exec } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

class Clipboard {
  private static readonly base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;

  private static isBase64Image(str: string): boolean {
    return Clipboard.base64Regex.test(str);
  }

  private static async commandExists(command: string): Promise<boolean> {
    return new Promise((resolve) => {
      exec(`command -v ${command}`, (error) => {
        resolve(!error);
      });
    });
  }

  private static async safeExecSync(command: string, options: any = {}): Promise<string | null> {
    try {
      return execSync(command, { ...options, encoding: 'utf8', stdio: 'pipe' });
    } catch (error) {
      if (error instanceof Error && 'stderr' in error) {
        const stderr = (error as any).stderr.toString();
        if (stderr.includes('No image data found on the clipboard')) {
          return null;
        }
      }
      throw error;
    }
  }

  private static async readClipboardImage(): Promise<string | null> {
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `clipboard_image_${Date.now()}.png`);

    try {
      if (process.platform === 'darwin') {
        // macOS
        if (await Clipboard.commandExists('pngpaste')) {
          const result = await Clipboard.safeExecSync(`pngpaste "${tempFilePath}"`);
          if (result === null) {
            return null; // No image in clipboard
          }
        } else {
          console.error('pngpaste is not installed. Please install it using "brew install pngpaste"');
          return null;
        }
      } else if (process.platform === 'win32') {
        // Windows
        await Clipboard.safeExecSync(`powershell -command "Add-Type -AssemblyName System.Windows.Forms;$clip=[Windows.Forms.Clipboard]::GetImage();if($clip -ne $null){$clip.Save('${tempFilePath}')}"`, { stdio: 'ignore' });
      } else {
        // Linux
        if (await Clipboard.commandExists('xclip')) {
          await Clipboard.safeExecSync(`xclip -selection clipboard -t image/png -o > "${tempFilePath}"`);
        } else {
          console.error('xclip is not installed. Please install it using your package manager.');
          return null;
        }
      }

      try {
        const stats = await fs.stat(tempFilePath);
        if (stats.size > 0) {
          const imageData = await fs.readFile(tempFilePath);
          return `data:image/png;base64,${imageData.toString('base64')}`;
        } else {
          return null;
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return null; // File doesn't exist, no image in clipboard
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error reading image from clipboard:', error);
      return null;
    } finally {
      try {
        await fs.unlink(tempFilePath);
      } catch (error) {
        // Ignore error if file doesn't exist
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error('Error deleting temporary file:', error);
        }
      }
    }
  }

  static async isImageInClipboard(): Promise<boolean> {
    const imageData = await Clipboard.readClipboardImage();
    return imageData !== null;
  }

  static async getImageFromClipboard(): Promise<string | null> {
    return await Clipboard.readClipboardImage();
  }

  static async isTextInClipboard(): Promise<boolean> {
    const clipboardContent = await Clipboard.getTextFromClipboard();
    return clipboardContent !== null && clipboardContent.length > 0 && !Clipboard.isBase64Image(clipboardContent);
  }

  static async getTextFromClipboard(): Promise<string | null> {
    try {
      let clipboardContent: string | null = null;
      if (process.platform === 'darwin') {
        // macOS
        if (await Clipboard.commandExists('pbpaste')) {
          clipboardContent = await Clipboard.safeExecSync('pbpaste');
        } else {
          console.error('pbpaste is not available on this system.');
          return null;
        }
      } else if (process.platform === 'win32') {
        // Windows
        clipboardContent = await Clipboard.safeExecSync('powershell -command "Get-Clipboard"');
      } else {
        // Linux
        if (await Clipboard.commandExists('xclip')) {
          clipboardContent = await Clipboard.safeExecSync('xclip -selection clipboard -o');
        } else {
          console.error('xclip is not installed. Please install it using your package manager.');
          return null;
        }
      }
      return clipboardContent && !Clipboard.isBase64Image(clipboardContent) ? clipboardContent.trim() : null;
    } catch (error) {
      console.error('Error getting text from clipboard:', error);
      return null;
    }
  }

  static async writeToClipboard(content: string): Promise<boolean> {
    try {
      if (process.platform === 'darwin') {
        // macOS
        if (await Clipboard.commandExists('pbcopy')) {
          await Clipboard.safeExecSync('pbcopy', { input: content });
        } else {
          console.error('pbcopy is not available on this system.');
          return false;
        }
      } else if (process.platform === 'win32') {
        // Windows
        await Clipboard.safeExecSync(`powershell -command "Set-Clipboard '${content.replace(/'/g, "''")}'"`);
      } else {
        // Linux
        if (await Clipboard.commandExists('xclip')) {
          await Clipboard.safeExecSync('xclip -selection clipboard', { input: content });
        } else {
          console.error('xclip is not installed. Please install it using your package manager.');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error writing to clipboard:', error);
      return false;
    }
  }
}

export default Clipboard;
