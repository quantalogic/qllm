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
 * Converts an image to a base64-encoded string or returns the input if it's already base64-encoded.
 * @param source The URL, file path, or base64-encoded string of the image.
 * @returns A Promise that resolves to the base64-encoded string of the image.
 */
export async function imageToBase64(source: string): Promise<ImageToBase64Output> {
  // Check if the input is already a base64-encoded string
  // The data URL format is 'data:[<MIME-type>][;charset=<encoding>][;base64],<data>'
  if (source.startsWith('data:') && source.includes(';base64,')) {
    // Extract the MIME type
    const mimeType = source.split(';')[0].split(':')[1];
    // The base64-encoded string is everything after the comma
    const base64 = source.split(';base64,')[1];

    return { base64, mimeType };
  }

  let buffer: Buffer;
  let mimeType: string | false;

  // Handle file:// protocol
  if (source.startsWith('file://')) {
    source = source.slice(7);
  }

  // Expand ~ to home directory
  if (source.startsWith('~/')) {
    source = path.join(os.homedir(), source.slice(2));
  }

  // Resolve relative paths
  source = path.resolve(source);

  if (source.startsWith('http://') || source.startsWith('https://')) {
    // Handle URL
    const response = await axios.get(source, { responseType: 'arraybuffer' });
    buffer = Buffer.from(response.data, 'binary');
    mimeType = response.headers['content-type'];
  } else {
    // Handle local file path
    buffer = await fs.readFile(source);
    mimeType = lookup(source);
  }

  if (!mimeType) {
    throw new Error(`Could not determine MIME type for: ${source}`);
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