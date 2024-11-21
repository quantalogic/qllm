// src/utils/document/document-types.ts
export interface FormatHandler {
    mimeTypes: string[];
    handle(buffer: Buffer): Promise<string>;
  }
  
  export interface ParseResult {
    content: string;
    mimeType: string;
    parsedContent?: string;
  }
  
  export interface DocumentParser {
    parse(buffer: Buffer, filename: string): Promise<string>;
    supports(filename: string): boolean;
  }
  
  export type LoadResult<T> = {
    content: T;
    mimeType: string;
    parsedContent?: string;
  };