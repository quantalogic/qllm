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

export const createImageContent = async (source: string): Promise<ImageUrlContent> => {
  try {
    const imageUrl = await imageToBase64(source);

    return {
      type: 'image_url',
      url: imageUrl,
    };
  } catch (error) {
    console.error(`Error processing image from: ${source}`, error);
    throw error;
  }
};
