// src/utils/clipboard.ts

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

class Clipboard {
  private static readonly base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;

  private static isBase64Image(str: string): boolean {
    return Clipboard.base64Regex.test(str);
  }

  private static readClipboard(): string {
    try {
      if (process.platform === 'darwin') {
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, 'clipboard_image.png');
        
        try {
          // Attempt to save clipboard content as image
          execSync(`pngpaste "${tempFilePath}"`);
          const imageData = fs.readFileSync(tempFilePath);
          fs.unlinkSync(tempFilePath); // Clean up temp file
          return `data:image/png;base64,${imageData.toString('base64')}`;
        } catch (imageError) {
          // If not an image, read as text
          return execSync('pbpaste').toString().trim();
        }
      } else if (process.platform === 'win32') {
        return execSync('powershell.exe -command "Get-Clipboard -Raw"').toString().trim();
      } else {
        // For Linux, we'll need to handle images differently
        // This example only handles text for Linux
        return execSync('xclip -selection clipboard -o').toString().trim();
      }
    } catch (error) {
      console.error('Error reading from clipboard:', error);
      throw new Error('Failed to read from clipboard');
    }
  }

  static isImageInClipboard(): boolean {
    try {
      const clipboardContent = Clipboard.readClipboard();
      return Clipboard.isBase64Image(clipboardContent);
    } catch (error) {
      console.error('Error checking for image in clipboard:', error);
      return false;
    }
  }

  static getImageFromClipboard(): string | null {
    try {
      const clipboardContent = Clipboard.readClipboard();
      return Clipboard.isBase64Image(clipboardContent) ? clipboardContent : null;
    } catch (error) {
      console.error('Error getting image from clipboard:', error);
      return null;
    }
  }

  static isTextInClipboard(): boolean {
    try {
      const clipboardContent = Clipboard.readClipboard();
      return clipboardContent.length > 0 && !Clipboard.isBase64Image(clipboardContent);
    } catch (error) {
      console.error('Error checking for text in clipboard:', error);
      return false;
    }
  }

  static getTextFromClipboard(): string | null {
    try {
      const clipboardContent = Clipboard.readClipboard();
      return Clipboard.isBase64Image(clipboardContent) ? null : clipboardContent;
    } catch (error) {
      console.error('Error getting text from clipboard:', error);
      return null;
    }
  }

  static writeToClipboard(content: string): boolean {
    try {
      if (process.platform === 'darwin') {
        execSync(`echo "${content}" | pbcopy`);
      } else if (process.platform === 'win32') {
        execSync(`echo ${content} | clip`);
      } else {
        execSync(`echo "${content}" | xclip -selection clipboard`);
      }
      return true;
    } catch (error) {
      console.error('Error writing to clipboard:', error);
      return false;
    }
  }
}

export = Clipboard;