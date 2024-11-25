// import {
//     DocumentLoader,
//     DocumentLoaderOptions,
//     LoadResult,
// } from "qllm-lib/src/utils/document/document-loader";
import { DocumentLoader, DocumentLoaderOptions } from 'qllm-lib/src/utils/document/document-loader';
import { LoadResult } from 'qllm-lib/src/types/document-types';
import { DefaultParserRegistry
 } from 'qllm-lib/src/utils/document/parsers/parser-registry';
import fs from 'fs/promises';
import path from 'path';


const testDocumentLoader = async () => {
    const testFullPath = "/home/jluong/Downloads/sample.pdf";
    // Alternative test path for YAML
    // const testFullPath = "/home/jluong/Dev/qllm/packages/qllm-samples/src/prompts/chain_of_tought_leader.yaml";

    const options: DocumentLoaderOptions = {
        encoding: 'utf-8',
        useCache: true,
        cacheDir: path.join(process.cwd(), '.cache'),
        maxFileSize: 100 * 1024 * 1024, // 100MB
        timeout: 30000 // 30 seconds
    };

    console.log("\nLoading local file:", testFullPath);
    const defaultRegistry = new DefaultParserRegistry();
    const loader = new DocumentLoader(testFullPath, defaultRegistry,options);

    // Type-safe event listeners
    loader.on('error', (error: Error) => {
        console.error('Error during loading:', error);
    });

    try {
        // Load and parse the document
        const result = await loader.loadAsString();
        
        console.log('File MIME type:', result.mimeType);
        console.log('Content preview:', result.content.slice(0, 100));

        // Save the content to a file
        const outputPath = path.join(process.cwd(), 'file_content.txt');
        console.log("debug")
        console.log(result.parsedContent)
        const contentToSave = result.parsedContent || result.content;
        
        await fs.writeFile(outputPath,contentToSave, 'utf-8');
        console.log(`Content saved to ${outputPath}`);

        // Additional information
        if (result.parsedContent) {
            console.log('Parsed content preview:', result.parsedContent.slice(0, 100));
        }

        return result;
    } catch (error) {
        console.error('Failed to load document:', error);
        throw error;
    }
};

// Run the test
testDocumentLoader()
    .then((result) => {
        console.log('\nTest completed successfully');
        if (result) {
            console.log('Document loaded and processed successfully');
        }
    })
    .catch((error) => {
        console.error('\nTest failed:', error);
        process.exit(1);
    });