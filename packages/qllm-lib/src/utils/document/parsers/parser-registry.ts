// parser-registry.ts
import { DocumentParser } from '../../../types/document-types';
import { TextParser, PDFParser } from './index';

export interface ParserRegistry {
    getParser(filename: string): DocumentParser | undefined;
}

export class DefaultParserRegistry implements ParserRegistry {
    private parsers: DocumentParser[];

    constructor() {
        this.parsers = [
            new TextParser(),
            new PDFParser()
        ];
    }

    getParser(filename: string): DocumentParser | undefined {
        return this.parsers.find(parser => parser.supports(filename));
    }
}