import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class Clipboard {
  private static readonly base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;

  private static isBase64Image(str: string): boolean {
    return Clipboard.base64Regex.test(str);
  }

  private static async readClipboard(): Promise<string> {
    try {
      if (process.platform === 'darwin') {
        const { stdout } = await execAsync('pbpaste');
        return stdout.trim();
      } else if (process.platform === 'win32') {
        const { stdout } = await execAsync('powershell.exe -command "Get-Clipboard"');
        return stdout.trim();
      } else {
        const { stdout } = await execAsync('xclip -selection clipboard -o');
        return stdout.trim();
      }
    } catch (error) {
      console.error('Error reading from clipboard:', error);
      throw new Error('Failed to read from clipboard');
    }
  }

  static async isImageInClipboard(): Promise<boolean> {
    try {
      const clipboardContent = await Clipboard.readClipboard();
      return Clipboard.isBase64Image(clipboardContent);
    } catch (error) {
      console.error('Error checking for image in clipboard:', error);
      return false;
    }
  }

  static async getImageFromClipboard(): Promise<string | null> {
    try {
      const clipboardContent = await Clipboard.readClipboard();
      return Clipboard.isBase64Image(clipboardContent) ? clipboardContent : null;
    } catch (error) {
      console.error('Error getting image from clipboard:', error);
      return null;
    }
  }

  static async isTextInClipboard(): Promise<boolean> {
    try {
      const clipboardContent = await Clipboard.readClipboard();
      return clipboardContent.length > 0 && !Clipboard.isBase64Image(clipboardContent);
    } catch (error) {
      console.error('Error checking for text in clipboard:', error);
      return false;
    }
  }

  static async getTextFromClipboard(): Promise<string | null> {
    try {
      const clipboardContent = await Clipboard.readClipboard();
      return Clipboard.isBase64Image(clipboardContent) ? null : clipboardContent;
    } catch (error) {
      console.error('Error getting text from clipboard:', error);
      return null;
    }
  }

  static async writeToClipboard(content: string): Promise<boolean> {
    try {
      if (process.platform === 'darwin') {
        await execAsync(`echo "${content}" | pbcopy`);
      } else if (process.platform === 'win32') {
        await execAsync(`echo ${content} | clip`);
      } else {
        await execAsync(`echo "${content}" | xclip -selection clipboard`);
      }
      return true;
    } catch (error) {
      console.error('Error writing to clipboard:', error);
      return false;
    }
  }
}