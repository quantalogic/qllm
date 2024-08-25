import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { lookup } from 'mime-types';

export type ImageToBase64Output = {
  base64: string;
  mimeType: string;
};

/**
 * Expands the tilde (~) in a file path to the user's home directory.
 * @param filePath The file path to expand.
 * @returns The expanded file path.
 */
function expandTilde(filePath: string): string {
  if (filePath.startsWith('~/') || filePath === '~') {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Converts an image to a base64-encoded string or returns the input if it's already base64-encoded.
 * @param source The URL, file path, or base64-encoded string of the image.
 * @returns A Promise that resolves to the base64-encoded string of the image.
 */
export async function imageToBase64(source: string): Promise<ImageToBase64Output> {
  // Check if the input is already a base64-encoded string
  if (source.startsWith('data:') && source.includes(';base64,')) {
    const [mimeType, base64] = source.split(';base64,');
    return { base64, mimeType: mimeType.split(':')[1] };
  }

  let buffer: Buffer;
  let mimeType: string;

  if (source.startsWith('http://') || source.startsWith('https://')) {
    // Handle URL
    const response = await axios.get(source, { responseType: 'arraybuffer' });
    buffer = Buffer.from(response.data);
    mimeType = response.headers['content-type'] as string;
  } else {
    // Handle local file path
    // Expand ~ to home directory and resolve relative paths
    source = path.resolve(expandTilde(source));

    // Handle file:// protocol
    if (source.startsWith('file://')) {
      source = source.slice(7);
    }

    buffer = await fs.readFile(source);
    const lookupResult = lookup(source);
    if (!lookupResult) {
      throw new Error(`Could not determine MIME type for: ${source}`);
    }
    mimeType = lookupResult;
  }

  const base64 = buffer.toString('base64');
  return { base64, mimeType };
}

export function createBase64Url(mimeType: string, base64: string): string {
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Extracts the MIME type from a base64-encoded data URL string.
 * @param dataUrl The base64-encoded data URL string.
 * @returns The extracted MIME type, or null if the input is not a valid data URL.
 */
export function extractMimeType(dataUrl: string): string | null {
  // Check if the input is a valid data URL
  if (!dataUrl.startsWith('data:') || !dataUrl.includes(';base64,')) {
    return null;
  }

  // Extract the MIME type
  const mimeType = dataUrl.split(';')[0].split(':')[1];

  // Return the MIME type if it's not empty, otherwise return null
  return mimeType && mimeType.trim() !== '' ? mimeType : null;
}
