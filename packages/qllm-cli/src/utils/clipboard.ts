import clipboardy from 'clipboardy';

export class Clipboard {
  private static isBase64Image(str: string): boolean {
    const base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/;
    return base64Regex.test(str);
  }

  static async isImageInClipboard(): Promise<boolean> {
    try {
      const clipboardContent = await clipboardy.read();
      return this.isBase64Image(clipboardContent);
    } catch (error) {
      console.error('Error checking for image in clipboard:', error);
      return false;
    }
  }

  static async getImageFromClipboard(): Promise<string | null> {
    try {
      const clipboardContent = await clipboardy.read();
      return this.isBase64Image(clipboardContent) ? clipboardContent : null;
    } catch (error) {
      console.error('Error getting image from clipboard:', error);
      return null;
    }
  }

  static async isTextInClipboard(): Promise<boolean> {
    try {
      const clipboardContent = await clipboardy.read();
      return clipboardContent.length > 0 && !this.isBase64Image(clipboardContent);
    } catch (error) {
      console.error('Error checking for text in clipboard:', error);
      return false;
    }
  }

  static async getTextFromClipboard(): Promise<string | null> {
    try {
      const clipboardContent = await clipboardy.read();
      return this.isBase64Image(clipboardContent) ? null : clipboardContent;
    } catch (error) {
      console.error('Error getting text from clipboard:', error);
      return null;
    }
  }
}