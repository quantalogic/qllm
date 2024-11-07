// src/utils/document/format-handlers.ts
// import * as pdf from 'pdf-parse';
import * as docx from 'docx';
import * as xlsx from 'xlsx';
import * as yaml from 'js-yaml';
import * as mammoth from 'mammoth';
import { readFile } from 'fs/promises';

export interface FormatHandler {
  mimeTypes: string[];
  handle: (buffer: Buffer) => Promise<string>;
}

export const formatHandlers: Record<string, FormatHandler> = {
  /* pdf: {
    mimeTypes: ['application/pdf'],
    handle: async (buffer: Buffer) => {
      const data = await pdf(buffer);
      return data.text;
    }
  }, */
  
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

  txt: {
    mimeTypes: ['text/plain', 'text/markdown', 'text/csv'],
    handle: async (buffer: Buffer) => buffer.toString('utf-8')
  },

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

export function getHandlerForMimeType(mimeType: string): FormatHandler | undefined {
  // Normalize mime type to lowercase
  const normalizedMimeType = mimeType.toLowerCase();
  
  return Object.values(formatHandlers).find(handler => 
    handler.mimeTypes.some(type => type.toLowerCase() === normalizedMimeType)
  );
}

export function getSupportedMimeTypes(): string[] {
  return Object.values(formatHandlers)
    .flatMap(handler => handler.mimeTypes)
    .sort();
}

export function isSupportedMimeType(mimeType: string): boolean {
  return !!getHandlerForMimeType(mimeType);
}