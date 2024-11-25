import {
    DocumentLoader,
    DocumentLoaderOptions,
} from "qllm-lib/src/utils/document/document-loader";
import * as fs from 'fs';
import path from 'path';

const testMultipleFiles = async () => {
    const inputs = [
        "/home/jluong/Dev/qllm/packages/qllm-samples/src/prompts/chain_of_tought_leader.yaml",
        "/home/jluong/Dev/qllm/CODE_OF_CONDUCT.md",
        "/home/jluong/Dev/qllm/packages/qllm-lib/jest.config.js",
        "/home/jluong/Dev/qllm/packages/qllm-lib/src/utils/document/document-loader.ts",
        "/home/jluong/Dev/qllm/packages/qllm-samples/package.json",
        "/home/jluong/Downloads/sample.pdf",
        "/home/jluong/Downloads/sample-local-pdf.pdf",
        "https://github.com/raphaelmansuy/code2prompt/blob/master/README.md",
        "https://github.com/raphaelmansuy/code2prompt/blob/master/ruff.toml",
        "https://github.com/raphaelmansuy/code2prompt/blob/master/script/detect_dead_code.sh",
        "https://github.com/jluongg/qllm/blob/feature/local_parser/packages/qllm-lib/src/utils/document/content-validator.ts",
        "https://github.com/jluongg/qllm/blob/feature/local_parser/package.json",
        "https://github.com/jluongg/qllm/blob/feature/local_parser/pnpm-workspace.yaml"
    ];

    const options: DocumentLoaderOptions = {
        useCache: true,
        maxRetries: 3,
    };

    console.log("\nLoading multiple documents:");
    const multipleResults = await DocumentLoader.loadMultipleAsString(
        inputs,
        options,
    );

    // Step 1: Create the formatted content using array mapping
    const outputContent = [
        "=== Document Loading Test Results ===\n",
        ...multipleResults.map((result, index) => {
            // Step 2: Format each document's information
            return [
                `=== Document ${index + 1} ===`,
                `File: ${inputs[index]}`,
                `MIME Type: ${result.mimeType}`,
                `Content Length: ${result.content.length}`,
                `Content:`,
                result.parsedContent,
                "=".repeat(50)
            ].join('\n'); // Join the document sections with newlines
        })
    ].join('\n\n'); // Join all documents with double newlines

    // Step 3: Write to file with explicit line endings
    const outputPath = path.join(process.cwd(), 'document_loading_results.txt');
    fs.writeFileSync(
        outputPath, 
        // Ensure consistent line endings across different operating systems
        outputContent.replace(/\n/g, '\r\n'),
        'utf-8'
    );

    // Step 4: Log progress
    console.log(`\nResults have been saved to: ${outputPath}`);
    
    // Step 5: Log individual document information
    multipleResults.forEach((result, index) => {
        console.log(`Document ${index + 1} loaded. Content length:`, result.content.length);
        console.log(`Document ${index + 1} MIME type:`, result.mimeType);
    });
};

testMultipleFiles()
    .then(() => {
        console.log("Test completed successfully");
    })
    .catch((error) => {
        console.error("Error in test suite:", error);
    });

