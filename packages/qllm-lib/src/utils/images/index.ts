import { ChatMessageContent, ImageUrlContent } from '../../types';
import { imageToBase64 } from './image-to-base64';
export { imageToBase64 } from './image-to-base64';

export const createTextMessageContent = (content: string | string[]): ChatMessageContent => {
  if (Array.isArray(content)) {
    return content.map((text) => ({ type: 'text', text }));
  } else {
    return { type: 'text', text: content };
  }
};
