// src/utils/clipboard.ts

import clipboardy from 'clipboardy';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

class Clipboard {
  private static readonly base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;

  private static isBase64Image(str: string): boolean {
    return Clipboard.base64Regex.test(str);
  }

  private static async readClipboardImage(): Promise<string | null> {
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, 'clipboard_image.png');

    try {
      if (process.platform === 'darwin') {
        // macOS
        execSync(`pngpaste "${tempFilePath}"`, { stdio: 'ignore' });
      } else if (process.platform === 'win32') {
        // Windows
        execSync(`powershell -command "Add-Type -AssemblyName System.Windows.Forms;$clip=[Windows.Forms.Clipboard]::GetImage();if($clip -ne $null){$clip.Save('${tempFilePath}')}"`);
      } else {
        // Linux
        execSync(`xclip -selection clipboard -t image/png -o > "${tempFilePath}"`, { stdio: 'ignore' });
      }

      if (fs.existsSync(tempFilePath) && fs.statSync(tempFilePath).size > 0) {
        const imageData = await fs.promises.readFile(tempFilePath);
        await fs.promises.unlink(tempFilePath); // Clean up temp file
        return `data:image/png;base64,${imageData.toString('base64')}`;
      }
    } catch (error) {
      console.error('Error reading image from clipboard:', error);
    }

    return null;
  }

  static async isImageInClipboard(): Promise<boolean> {
    const imageData = await Clipboard.readClipboardImage();
    return imageData !== null;
  }

  static async getImageFromClipboard(): Promise<string | null> {
    return await Clipboard.readClipboardImage();
  }

  static async isTextInClipboard(): Promise<boolean> {
    try {
      const clipboardContent = clipboardy.readSync();
      return clipboardContent.length > 0 && !Clipboard.isBase64Image(clipboardContent);
    } catch (error) {
      console.error('Error checking for text in clipboard:', error);
      return false;
    }
  }

  static async getTextFromClipboard(): Promise<string | null> {
    try {
      const clipboardContent = clipboardy.readSync();
      return Clipboard.isBase64Image(clipboardContent) ? null : clipboardContent;
    } catch (error) {
      console.error('Error getting text from clipboard:', error);
      return null;
    }
  }

  static async writeToClipboard(content: string): Promise<boolean> {
    try {
      clipboardy.writeSync(content);
      return true;
    } catch (error) {
      console.error('Error writing to clipboard:', error);
      return false;
    }
  }
}

export = Clipboard;