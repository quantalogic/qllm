import Anthropic from '@anthropic-ai/sdk';
import {
  ChatMessage,
  isImageUrlContent,
  isTextContent,
  MessageContent,
} from '../../types';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as mime from 'mime-types';

export const formatMessage = async (message: ChatMessage): Promise<Anthropic.MessageParam> => {
  let content: string | Anthropic.MessageParam['content'];

  if (typeof message.content === 'string') {
    content = message.content;
  } else if (Array.isArray(message.content)) {
    content = await Promise.all(message.content.map(formatContent));
  } else {
    content = [await formatContent(message.content)];
  }

  return {
    role: message.role === 'user' ? 'user' : 'assistant',
    content,
  };
};

export async function formatMessages(messages: ChatMessage[]): Promise<Anthropic.MessageParam[]> {
  const formattedMessages = await Promise.all(messages.map(formatMessage));
  return formattedMessages;
}

export async function formatContent(
  content: MessageContent,
): Promise<Anthropic.TextBlockParam | Anthropic.ImageBlockParam> {
  if (isTextContent(content)) {
    return {
      type: 'text',
      text: content.text,
    };
  } else if (isImageUrlContent(content)) {
    const base64Content = await downloadAndConvertToBase64(content.imageUrl.url);
    const imageContent: Anthropic.ImageBlockParam = {
      type: 'image',
      source: {
        type: 'base64',
        media_type: base64Content.mimeType as
          | 'image/jpeg'
          | 'image/png'
          | 'image/gif'
          | 'image/webp',
        data: base64Content.base64,
      },
    };
    return imageContent;
  }
  throw new Error('Unsupported content type');
}

async function downloadAndConvertToBase64(
  source: string,
): Promise<{ base64: string; mimeType: string }> {
  try {
    let buffer: Buffer;
    let mimeType: string;

    if (source.startsWith('http://') || source.startsWith('https://')) {
      // Handle URL
      const response = await axios.get(source, { responseType: 'arraybuffer' });
      buffer = Buffer.from(response.data);
      mimeType = response.headers['content-type'] || mime.lookup(source) || 'application/octet-stream';
    } else {
      // Handle local file path
      const absolutePath = path.resolve(source);
      buffer = await fs.readFile(absolutePath);
      mimeType = mime.lookup(absolutePath) || 'application/octet-stream';
    }

    // Ensure the mimeType is a valid image type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)) {
      throw new Error(`Unsupported image type: ${mimeType}`);
    }

    return {
      base64: buffer.toString('base64'),
      mimeType: mimeType,
    };
  } catch (error) {
    console.error(`Error processing image from: ${source}`, error);
    throw error;
  }
}