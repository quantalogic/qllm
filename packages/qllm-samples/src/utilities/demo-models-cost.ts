import { TokenController } from "qllm-lib";
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
        .withModel("gpt-4")
        .withParameters({ max_tokens: 500, temperature: 0.5, top_p: 0.9 })
        .build();

    const result = await executeTemplateWithTokens(documentSummarizer);
    console.log("🎉 Template execution result:");
    console.log(result);
}

async function executeTemplateWithTokens(templateDefinition: TemplateDefinition) {
    try {
        const provider = createLLMProvider({ name: "openai" });
        const templateExecutor = new TemplateExecutor();
        
        // First execute the template
        const executionResult = await templateExecutor.execute({
            template: templateDefinition,
            provider: provider,
            variables: {
                file_url: "https://www.quantalogic.app/blogs/introduction",
                max_words: 150,
            },
            stream: false, // Changed to false for better token calculation
        });

        // Wait for the response to be complete
        const fullResponse = executionResult.response;
        const fullPrompt = templateDefinition.content;

        try {
            // Calculate total tokens and cost
            const tokenResults = await TokenController.calculate({
                input_text: fullPrompt,
                output_text: fullResponse,
                provider: "openai",
                model: "gpt-4"
            });

            // Calculate input tokens
            const inputTokens = await TokenController.calculateInput({
                input_text: fullPrompt,
                provider: "openai",
                model: "gpt-4"
            });

            // Calculate output tokens
            const outputTokens = await TokenController.calculateOutput({
                output_text: fullResponse,
                provider: "openai",
                model: "gpt-4"
            });

            return {
                execution_result: executionResult,
                token_analysis: {
                    total: tokenResults,
                    input: inputTokens,
                    output: outputTokens
                }
            };
        } catch (tokenError) {
            console.error("Error calculating tokens:", tokenError);
            // Return execution result even if token calculation fails
            return {
                execution_result: executionResult,
                token_analysis: null,
                error: tokenError
            };
        }
    } catch (error) {
        console.error("Error in template execution:", error);
        throw error;
    }
}

// Add event listeners for detailed logging
function addExecutionListeners(templateExecutor: TemplateExecutor) {
    templateExecutor.on("requestSent", (request) => {
        console.log("🚀 Request sent:", request);
    });

    templateExecutor.on("responseReceived", (response) => {
        console.log("📨 Response received");
    });

    templateExecutor.on("streamComplete", (finalResponse) => {
        console.log("✅ Stream complete");
    });
}

main()
    .then(() => {
        console.log("✅ Finished running the token calculator.");
    })
    .catch((err) => {
        console.error(
            "❌ An error occurred while running the token calculator:",
            err
        );
    });