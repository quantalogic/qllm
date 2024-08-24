import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { lookup } from 'mime-types';

/**
 * Converts an image to a base64-encoded string.
 * @param source The URL or file path of the image.
 * @returns A Promise that resolves to the base64-encoded string of the image.
 */
export async function imageToBase64(source: string): Promise<string> {
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
  return `data:${mimeType};base64,${base64}`;
}