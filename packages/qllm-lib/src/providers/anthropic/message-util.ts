import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage, isImageUrlContent, isTextContent, MessageContent } from '../../types';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as mime from 'mime-types';
import { imageToBase64 } from '../../utils';
import { extractMimeType } from '../../utils/images/image-to-base64';

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
    const base64Content = await imageToBase64(content.url);
    // Extract mime type from base64 string
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
