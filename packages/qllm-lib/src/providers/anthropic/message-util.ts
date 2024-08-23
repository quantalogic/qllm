import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage, isImageUrlContent, isTextContent, MessageContent, ImageUrlContent } from '../../types';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function formatMessages(messages: ChatMessage[]): Promise<Anthropic.MessageParam[]> {
  const formattedMessages = await Promise.all(messages.map(async (message): Promise<Anthropic.MessageParam> => {
    let content: string | Anthropic.MessageParam['content'];

    if (typeof message.content === 'string') {
      content = message.content;
    } else if (Array.isArray(message.content)) {
      content = await Promise.all(message.content.map(formatContent));
    } else {
      content = [await formatContent(message.content)];
    }

    return {
      role: message.role === 'system' ? 'user' : message.role,
      content,
    };
  }));

  return formattedMessages;
}

export async function formatContent(content: MessageContent): Promise<Anthropic.TextBlockParam | Anthropic.ImageBlockParam> {
  if (isTextContent(content)) {
    return {
      type: 'text',
      text: content.text,
    };
  } else if (isImageUrlContent(content)) {
    const base64Content = await downloadAndConvertToBase64(content.imageUrl.url);
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: getMediaType(content.imageUrl.url),
        data: base64Content,
      },
    };
  }
  throw new Error('Unsupported content type');
}

async function downloadAndConvertToBase64(source: string): Promise<string> {
  try {
    let content: string;

    if (source.startsWith('http://') || source.startsWith('https://')) {
      // Handle URL
      const response = await axios.get(source, { responseType: 'arraybuffer' });
      content = Buffer.from(response.data).toString('base64');
    } else {
      // Handle local file path
      const absolutePath = path.resolve(source);
      content = await fs.readFile(absolutePath, { encoding: 'base64' });
    }

    return content;
  } catch (error) {
    console.error(`Error processing image from: ${source}`, error);
    throw error;
  }
}

function getMediaType(url: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  const extension = url.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      throw new Error('Unsupported image format');
  }
}