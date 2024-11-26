/**
 * @fileoverview Document format handlers for converting various file formats to text.
 * Supports multiple document formats including:
 * - DOCX (Word documents)
 * - TXT (Plain text)
 * - JSON
 * - YAML/YML
 * - XLSX (Excel spreadsheets)
 * 
 * Each handler implements a common interface for consistent processing.
 * 
 * @author QLLM Team
 * @module utils/document/format-handlers
 */

import * as docx from 'docx';
import * as xlsx from 'xlsx';
import * as yaml from 'js-yaml';
import * as mammoth from 'mammoth';
import { readFile } from 'fs/promises';
const pdfParse = require('pdf-parse')
import { FormatHandler } from '../../types/document-types';  // Import from document-types.ts

export { FormatHandler };  // Re-export the type

console.log("In format-handlers")

/**
 * Registry of available format handlers.
 * Each handler implements the FormatHandler interface.
 * 
 * @example
 * ```typescript
 * // Using a specific handler
 * const handler = formatHandlers.json;
 * const text = await handler.handle(buffer);
 * ```
 */
export const formatHandlers: Record<string, FormatHandler> = {
  pdf: {
    mimeTypes: ['application/pdf'],
    async handle(buffer: Buffer): Promise<string> {
      try {
        const data = await pdfParse(buffer);
        let text = data.text;
        text = text
          .replace(/\r\n/g, '\n')
          .replace(/\s*\n{3,}/g, '\n\n')
          .replace(/([.!?])\s+/g, '$1\n')
          .trim();
        return text;
      } catch (error) {
        throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  },

  docx: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ],
    async handle(buffer: Buffer): Promise<string> {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      return result.value;
    }
  },

  yaml: {
    mimeTypes: [
      'text/yaml',
      'application/x-yaml',
      'text/yml',
      'application/yml'
    ],
    async handle(buffer: Buffer): Promise<string> {
      try {
        const content = yaml.load(buffer.toString());
        return yaml.dump(content);
      } catch (error) {
        throw new Error(`Invalid YAML file: ${error}`);
      }
    }
  },

  json: {
    mimeTypes: ['application/json'],
    async handle(buffer: Buffer): Promise<string> {
      try {
        const content = JSON.parse(buffer.toString());
        return JSON.stringify(content, null, 2);
      } catch (error) {
        throw new Error(`Invalid JSON file: ${error}`);
      }
    }
  }
};

export const getHandlerForMimeType = (mimeType: string): FormatHandler | undefined => {
  const normalizedMimeType = mimeType.toLowerCase();
  return Object.values(formatHandlers).find(handler => 
    handler.mimeTypes.some((type: string) => type.toLowerCase() === normalizedMimeType)
  );
};

export const getSupportedMimeTypes = (): string[] => {
  return Object.values(formatHandlers)
    .flatMap(handler => handler.mimeTypes)
    .sort();
};

export const isSupportedMimeType = (mimeType: string): boolean => {
  return !!getHandlerForMimeType(mimeType);
};