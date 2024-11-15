import { DocumentLoader, DocumentLoaderOptions } from 'qllm-lib/src/utils/document/document-loader';
import { DefaultParserRegistry } from 'qllm-lib/src/utils/document/parsers/parser-registry';
import fs from 'fs/promises';
import path from 'path';


const testUrlDocumentLoader = async () => {
    // const testUrl = "https://example.com";
    // const testUrl = "https://pdfobject.com/pdf/sample.pdf";
    // const testUrl = "https://github.com/raphaelmansuy/code2prompt/blob/master/README.md";
    // const testUrl = "https://github.com/raphaelmansuy/code2prompt/blob/master/ruff.toml";
    // const testUrl = "https://github.com/raphaelmansuy/code2prompt/blob/master/script/detect_dead_code.sh"
    // const testUrl = "https://github.com/jluongg/qllm/blob/feature/local_parser/packages/qllm-lib/src/utils/document/content-validator.ts";
    // const testUrl = "https://github.com/jluongg/qllm/blob/feature/local_parser/package.json"
    const testUrl = "https://github.com/jluongg/qllm/blob/feature/local_parser/pnpm-workspace.yaml"

    const options: DocumentLoaderOptions = {
        encoding: 'utf-8',
        useCache: true,
        cacheDir: path.join(process.cwd(), '.cache'),
        maxFileSize: 100 * 1024 * 1024, // 100MB
        timeout: 30000, // 30 seconds
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    };

    console.log("\nLoading from URL:", testUrl);
    const defaultRegistry = new DefaultParserRegistry();
    const loader = new DocumentLoader(testUrl, defaultRegistry, options);

    loader.on('error', (error: Error) => {
        console.error('Error during loading:', error);
    });

    loader.on('progress', (progress: number) => {
        console.log(`Download progress: ${(progress * 100).toFixed(2)}%`);
    });

    try {
        const result = await loader.loadAsString();
        
        const finalContent = result.parsedContent || result.content;

        // Save both HTML and plain text versions
        const outputDir = process.cwd();
        const htmlPath = path.join(outputDir, 'url_content.html');
        const txtPath = path.join(outputDir, 'url_content.txt');
        
        await fs.writeFile(txtPath, finalContent, 'utf-8');

        console.log(`Plain text content saved to ${txtPath}`);
        console.log('\nPlain text preview:');
        console.log(finalContent.slice(0, 200));

        return result;
    } catch (error) {
        console.error('Failed to load document:', error);
        throw error;
    }
};

// Run the test
testUrlDocumentLoader()
    .then(() => {
        console.log('\nTest completed successfully');
    })
    .catch((error) => {
        console.error('\nTest failed:', error);
        process.exit(1);
    });