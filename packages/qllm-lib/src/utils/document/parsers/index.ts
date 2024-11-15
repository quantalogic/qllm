// src/utils/document/parsers/base-parser.ts
import * as path from 'path';
import { DocumentParser } from '../../../types/document-types';
// src/utils/document/parsers/pdf-parser.ts
import * as mime from 'mime-types';
import pdfParse from 'pdf-parse';

export abstract class BaseParser implements DocumentParser {
  abstract parse(buffer: Buffer, filename: string): Promise<string>;
  abstract supports(filename: string): boolean;

  protected getExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }
}


export class TextParser extends BaseParser {
  private readonly textExtensions = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.py', '.rb', '.java',
    '.html', '.css', '.scss', '.less',
    '.json', '.yaml', '.yml', '.xml', '.toml', '.ini',
    '.txt', '.md', '.csv', '.sql', '.r', '.log'
  ]);

  private readonly textMimeTypes = new Set([
    'text/plain',
    'text/typescript',
    'application/typescript',
    'application/x-typescript',
    'video/mp2t',
    'text/markdown',
    'text/csv',
    'text/css',
    'text/html',
    'application/javascript'
  ]);

  supports(filename: string): boolean {
    const ext = this.getExtension(filename);
    return this.textExtensions.has(ext) || 
           this.textMimeTypes.has(mime.lookup(filename) || '');
  }

  async parse(buffer: Buffer): Promise<string> {
    return buffer.toString('utf-8');
  }
}


export class PDFParser extends BaseParser {
  supports(filename: string): boolean {
      return this.getExtension(filename) === '.pdf';
  }

  async parse(buffer: Buffer): Promise<string> {
      try {
          const options = {
              pagerender: (pageData: any) => pageData.getTextContent()
                  .then((textContent: any) => {
                      let lastY: number;
                      return textContent.items
                          .map((item: any) => {
                              const text = lastY !== item.transform[5] ?
                                  `\n${item.str}` : item.str;
                              lastY = item.transform[5];
                              return text;
                          })
                          .join('');
                  })
          };
          const data = await pdfParse(buffer, options);
          return data.text
              .replace(/\r\n/g, '\n')
              .replace(/\s*\n{3,}/g, '\n\n')
              .trim();
      } catch (error) {
          throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : String(error)}`);
      }
  }
}