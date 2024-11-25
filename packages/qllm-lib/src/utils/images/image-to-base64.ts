/**
 * @fileoverview Image conversion utility providing functions to convert images to base64 format.
 * Supports multiple input sources including URLs, local files, and existing base64 strings.
 * 
 * @author QLLM Team
 * @module utils/images/image-to-base64
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { lookup } from 'mime-types';

/**
 * Represents the output of image to base64 conversion.
 */
export type ImageToBase64Output = {
  /** The base64-encoded image data (without the data URL prefix) */
  base64: string;
  /** The MIME type of the image (e.g., 'image/jpeg', 'image/png') */
  mimeType: string;
};

/**
 * Expands the tilde (~) in a file path to the user's home directory.
 * @param {string} filePath - The file path to expand
 * @returns {string} The expanded file path with ~ replaced by the home directory
 * @private
 */
function expandTilde(filePath: string): string {
  if (filePath.startsWith('~/') || filePath === '~') {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Converts an image to a base64-encoded string with MIME type information.
 * Supports multiple input formats:
 * - URLs (http:// or https://)
 * - Local file paths (with ~ expansion)
 * - file:// protocol URLs
 * - Existing base64 data URLs
 * 
 * @param {string} source - The image source (URL, file path, or base64 string)
 * @returns {Promise<ImageToBase64Output>} Object containing base64 data and MIME type
 * @throws {Error} If MIME type cannot be determined or file cannot be read
 * 
 * @example
 * ```typescript
 * // From URL
 * const urlImage = await imageToBase64('https://example.com/image.jpg');
 * 
 * // From local file
 * const fileImage = await imageToBase64('~/images/photo.png');
 * 
 * // From existing base64
 * const base64Image = await imageToBase64('data:image/jpeg;base64,/9j/4AAQ...');
 * ```
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

/**
 * Creates a complete base64 data URL from MIME type and base64 data.
 * 
 * @param {string} mimeType - The MIME type of the image
 * @param {string} base64 - The base64-encoded image data
 * @returns {string} Complete data URL string
 * 
 * @example
 * ```typescript
 * const dataUrl = createBase64Url('image/jpeg', 'base64Data...');
 * // Returns: data:image/jpeg;base64,base64Data...
 * ```
 */
export function createBase64Url(mimeType: string, base64: string): string {
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Extracts the MIME type from a base64-encoded data URL string.
 * 
 * @param {string} dataUrl - The base64-encoded data URL string
 * @returns {string | null} The extracted MIME type, or null if invalid input
 * 
 * @example
 * ```typescript
 * const mimeType = extractMimeType('data:image/png;base64,iVBORw0...');
 * // Returns: 'image/png'
 * ```
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
