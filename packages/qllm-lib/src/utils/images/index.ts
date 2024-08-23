import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { ChatMessageContent, ImageUrlContent } from '../../types';

export const createTextMessageContent = (content: string | string[]): ChatMessageContent => {
  if (Array.isArray(content)) {
    return content.map((text) => ({ type: 'text', text }));
  } else {
    return { type: 'text', text: content };
  }
};

export const createImageContent = async (source: string): Promise<ImageUrlContent> => {
  try {
    let content: string;
    let mimeType: string;

    if (source.startsWith('http://') || source.startsWith('https://')) {
      // Handle URL
      const response = await axios.get(source, { responseType: 'arraybuffer' });
      content = Buffer.from(response.data, 'binary').toString('base64');
      mimeType = response.headers['content-type'];
    } else {
      // Handle local file path
      const absolutePath = path.resolve(source);
      content = await fs.readFile(absolutePath, { encoding: 'base64' });
      mimeType = getMimeType(absolutePath);
    }

    const imageUrl = `data:${mimeType};base64,${content}`;

    return {
      type: 'image_url',
      url: imageUrl,
    };
  } catch (error) {
    console.error(`Error processing image from: ${source}`, error);
    throw error;
  }
};

// Helper function to determine MIME type based on file extension
function getMimeType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase().slice(1);
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}
