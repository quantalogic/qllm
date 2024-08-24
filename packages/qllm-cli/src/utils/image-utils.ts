import fs from 'fs/promises';
import mime from 'mime-types';

export async function isImageFile(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) return false;

    const mimeType = mime.lookup(filePath);
    return mimeType ? mimeType.startsWith('image/') : false;
  } catch {
    return false;
  }
}

export async function readImageFileAndConvertToBase64(imagePath: string): Promise<string>  {
  if (await isImageFile(imagePath)) {
    // Convert file to base64
    const fileContent = await fs.readFile(imagePath);
    const mimeType = mime.lookup(imagePath) || 'application/octet-stream';
    return `data:${mimeType};base64,${fileContent.toString('base64')}`;
  }
  // Assume it's already a valid URL or base64 string
  return imagePath;
}