/**
 * @fileoverview Image utility module providing functions for handling chat message content and image conversions.
 * Exports utilities for creating text message content and image-to-base64 conversion functionality.
 * 
 * @author QLLM Team
 * @module utils/images
 */

import { ChatMessageContent, ImageUrlContent } from '../../types';
import { imageToBase64 } from './image-to-base64';
export { imageToBase64 } from './image-to-base64';

/**
 * Creates a chat message content object from text input.
 * Supports both single strings and arrays of strings, converting them to the appropriate message format.
 * 
 * @param {string | string[]} content - Text content to convert into message format
 * @returns {ChatMessageContent} Formatted chat message content object(s)
 * 
 * @example
 * ```typescript
 * // Single message
 * const singleMessage = createTextMessageContent('Hello');
 * // Multiple messages
 * const multiMessage = createTextMessageContent(['Hello', 'World']);
 * ```
 */
export const createTextMessageContent = (content: string | string[]): ChatMessageContent => {
  if (Array.isArray(content)) {
    return content.map((text) => ({ type: 'text', text }));
  } else {
    return { type: 'text', text: content };
  }
};
