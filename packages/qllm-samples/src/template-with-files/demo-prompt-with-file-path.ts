import { createLLMProvider } from "qllm-lib";
import {
    TemplateDefinition,
    TemplateDefinitionBuilder,
    TemplateExecutor,
} from "qllm-lib";

async function main(): Promise<void> {
    const documentSummarizer = TemplateDefinitionBuilder.create({
        name: "📄 Document Summarizer",
        version: "1.0.0",
        description: "🚀 Summarize documents from a local file",
        author: "🤖 SummarizerAI",
        content: `
    ## Summarize the following document:

    <document>
    {{document_content}}
    </document>
    
    Requirements:
    - Provide a concise summary of the main points
    - Highlight key insights or findings
    - Keep the summary within {{max_words}} words
    - Write the summary in <summary> tags
    
    ## Format the output as follows:

    <relexions> Your reflections on the document </relexions>

    <summary> The content of the summary </summary>

    END.
    `,
    })
        .withInputVariable(
            "document_content",
            "file_path", // Changed to file_path type
            "📂 The path to the document to summarize"
        )
        .withInputVariable(
            "max_words",
            "number",
            "📏 Maximum number of words for the summary"
        )
        .withOutputVariable("summary", "string", {
            description: "📝 The generated summary of the document",
        })
        .withModel("gpt-4")
        .withParameters({ max_tokens: 500, temperature: 0.5, top_p: 0.9 })
        .build();

    const result = await executeTemplate(documentSummarizer);
    console.log("🎉 Template execution result:");
    console.log(result);
}

async function executeTemplate(templateDefinition: TemplateDefinition) {
    try {
        // Execute the template
        const provider = createLLMProvider({ name: "openai" });
        const templateExecutor = new TemplateExecutor();
        
        const executionResult = await templateExecutor.execute({
            template: templateDefinition,
            provider: provider,
            variables: {
                document_content: "./test.txt", // Just pass the file path
                max_words: 150,
            },
            stream: true,
        });

        templateExecutor.on("requestSent", (request) => {
            console.log("🚀 Request sent:");
            console.dir(request, { depth: null });
        });

        templateExecutor.on("streamChunk", (chunk: string) => {
            process.stdout.write(chunk);
        });

        return executionResult;
    } catch (error) {
        console.error("Error processing document:", error);
        throw error;
    }
}

main()
    .then(() => {
        console.log("✅ Finished running the document summarizer.");
    })
    .catch((err) => {
        console.error(
            "❌ An error occurred while running the document summarizer:",
            err,
        );
    });