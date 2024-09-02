import { createLLMProvider } from "qllm-lib";
import {
    TemplateDefinition,
    TemplateDefinitionBuilder,
    TemplateExecutor,
} from "qllm-lib";

async function main(): Promise<void> {
    const documentSummarizer = TemplateDefinitionBuilder.create({
        name: "📄 URL Document Summarizer",
        version: "1.0.0",
        description: "🚀 Summarize documents from a given URL",
        author: "🤖 SummarizerAI",
        content: `

    ## Summarize the following document:

    <document>
    {{include: {{file_url}} }}
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
            "file_url",
            "string",
            "🔗 The URL of the document to summarize",
        )
        .withInputVariable(
            "max_words",
            "number",
            "📏 Maximum number of words for the summary",
        )
        .withOutputVariable("summary", "string", {
            description: "📝 The generated summary of the document",
        })
        .withTags("📚 document analysis", "🔍 summarization", "🌐 web content")
        .withCategories("📊 Information Processing", "🤖 AI-Assisted Analysis")
        .withModel("gpt-4")
        .withParameters({ max_tokens: 500, temperature: 0.5, top_p: 0.9 })
        .withPromptType("🧠 text_summarization")
        .withTaskDescription(
            "🎯 Generate concise summaries of documents from provided URLs",
        )
        .build();

    console.log("🏗️ Generated Template:");
    console.log(documentSummarizer);

    const result = await executeTemplate(documentSummarizer);
    console.log("🎉 Template execution result:");
    console.log(result);
}

async function executeTemplate(templateDefinition: TemplateDefinition) {
    // Execute the template
    const provider = createLLMProvider({ name: "openai" });
    const templateExecutor = new TemplateExecutor();
    const executionResult = templateExecutor.execute({
        template: templateDefinition,
        provider: provider,
        variables: {
            file_url: "https://www.quantalogic.app/blogs/introduction",
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
