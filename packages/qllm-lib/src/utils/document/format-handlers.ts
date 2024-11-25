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

/**
 * Interface defining a document format handler.
 * Each handler must specify supported MIME types and provide a processing function.
 */
export interface FormatHandler {
  /** List of MIME types this handler can process */
  mimeTypes: string[];
  /** Function to convert document buffer to text */
  handle: (buffer: Buffer) => Promise<string>;
}

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
  /* pdf: {
    mimeTypes: ['application/pdf'],
    handle: async (buffer: Buffer) => {
      const data = await pdf(buffer);
      return data.text;
    }
  }, */
  
  /**
   * Handler for Microsoft Word documents.
   * Supports both modern DOCX and legacy DOC formats.
   */
  docx: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ],
    handle: async (buffer: Buffer) => {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
  },

  /**
   * Handler for plain text documents.
   * Supports text, markdown, and CSV files.
   */
  txt: {
    mimeTypes: ['text/plain', 'text/markdown', 'text/csv'],
    handle: async (buffer: Buffer) => buffer.toString('utf-8')
  },

  /**
   * Handler for JSON documents.
   * Parses and pretty-prints JSON content.
   */
  json: {
    mimeTypes: ['application/json'],
    handle: async (buffer: Buffer) => {
      try {
        const content = JSON.parse(buffer.toString());
        return JSON.stringify(content, null, 2);
      } catch (error) {
        throw new Error(`Invalid JSON file: ${error}`);
      }
    }
  },

  /**
   * Handler for YAML documents.
   * Supports both YAML and YML file formats.
   */
  yaml: {
    mimeTypes: ['text/yaml', 'application/x-yaml', 'text/yml', 'application/yml'],
    handle: async (buffer: Buffer) => {
      try {
        const content = yaml.load(buffer.toString());
        return yaml.dump(content);
      } catch (error) {
        throw new Error(`Invalid YAML file: ${error}`);
      }
    }
  },

  /**
   * Handler for Excel spreadsheets.
   * Supports both modern XLSX and legacy XLS formats.
   * Extracts text from all sheets in the workbook.
   */
  xlsx: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ],
    handle: async (buffer: Buffer) => {
      try {
        const workbook = xlsx.read(buffer);
        const sheets = workbook.SheetNames.map(sheet => {
          const worksheet = workbook.Sheets[sheet];
          return {
            name: sheet,
            content: xlsx.utils.sheet_to_txt(worksheet)
          };
        });

        return sheets.map(sheet => 
          `Sheet: ${sheet.name}\n${sheet.content}\n\n`
        ).join('');
      } catch (error) {
        throw new Error(`Failed to process Excel file: ${error}`);
      }
    }
  }
};

/**
 * Gets the appropriate format handler for a given MIME type.
 * MIME type matching is case-insensitive.
 * 
 * @param {string} mimeType - MIME type to find handler for
 * @returns {FormatHandler | undefined} Handler for the MIME type, or undefined if not supported
 * 
 * @example
 * ```typescript
 * const handler = getHandlerForMimeType('application/json');
 * if (handler) {
 *   const text = await handler.handle(buffer);
 * }
 * ```
 */
export function getHandlerForMimeType(mimeType: string): FormatHandler | undefined {
  // Normalize mime type to lowercase
  const normalizedMimeType = mimeType.toLowerCase();
  
  return Object.values(formatHandlers).find(handler => 
    handler.mimeTypes.some(type => type.toLowerCase() === normalizedMimeType)
  );
}

/**
 * Gets a sorted list of all supported MIME types.
 * 
 * @returns {string[]} Array of supported MIME types
 * 
 * @example
 * ```typescript
 * const mimeTypes = getSupportedMimeTypes();
 * console.log('Supported formats:', mimeTypes.join(', '));
 * ```
 */
export function getSupportedMimeTypes(): string[] {
  return Object.values(formatHandlers)
    .flatMap(handler => handler.mimeTypes)
    .sort();
}

/**
 * Checks if a given MIME type is supported.
 * 
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} True if the MIME type is supported
 * 
 * @example
 * ```typescript
 * if (isSupportedMimeType('application/json')) {
 *   // Process JSON file
 * }
 * ```
 */
export function isSupportedMimeType(mimeType: string): boolean {
  return !!getHandlerForMimeType(mimeType);
}