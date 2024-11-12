import { createLLMProvider } from "qllm-lib";
import {
    TemplateDefinition,
    TemplateDefinitionBuilder,
    TemplateExecutor,
} from "qllm-lib";

async function main(): Promise<void> {
    const languageTranslator = TemplateDefinitionBuilder.create({
        name: "🌐 Universal Language Translator",
        version: "1.0.0",
        description: "🔄 Translate text between multiple languages with context awareness",
        author: "🤖 TranslatorAI",
        content: `
        ## Translate the following text:

        <source_text>
        {{text_to_translate}}
        </source_text>

        Source Language: {{source_language}}
        Target Language: {{target_language}}

        Requirements:
        - Maintain the original meaning and context
        - Preserve formatting and special characters
        - Consider cultural nuances and idioms
        - Provide alternative translations for ambiguous terms
        - Keep the style consistent with the source text
        
        ## Format the output as follows:

        <translation>
        The translated text
        </translation>

        <alternatives>
        List any alternative translations for ambiguous terms or phrases
        </alternatives>

        <notes>
        Any relevant cultural or contextual notes about the translation
        </notes>

        END.
        `,
    })
        .withInputVariable(
            "text_to_translate",
            "string",
            "📝 The text that needs to be translated",
        )
        .withInputVariable(
            "source_language",
            "string",
            "🔤 The language of the source text",
        )
        .withInputVariable(
            "target_language",
            "string",
            "🎯 The desired language for translation",
        )
        .withOutputVariable("translation", "string", {
            description: "🔄 The translated text",
        })
        .withOutputVariable("alternatives", "string", {
            description: "📚 Alternative translations for ambiguous terms",
        })
        .withOutputVariable("notes", "string", {
            description: "📋 Cultural and contextual notes",
        })
        .withTags("🌐 translation", "🔤 language", "🌍 localization")
        .withCategories("📚 Language Processing", "🤖 AI-Assisted Translation")
        .withModel("gpt-4")
        .withParameters({
            max_tokens: 1000,
            temperature: 0.3,
            top_p: 0.95,
            presence_penalty: 0.1,
            frequency_penalty: 0.1,
        })
        .withPromptType("🔤 language_translation")
        .withTaskDescription(
            "🎯 Provide accurate and context-aware translations between different languages",
        )
        .build();

    console.log("🏗️ Generated Translation Template:");
    console.log(languageTranslator);

    const result = await executeTemplate(languageTranslator);
    console.log("🎉 Translation result:");
    console.log(result);
}

async function executeTemplate(templateDefinition: TemplateDefinition) {
    const provider = createLLMProvider({ name: "openai" });
    const templateExecutor = new TemplateExecutor();
    const executionResult = templateExecutor.execute({
        template: templateDefinition,
        provider: provider,
        variables: {
            text_to_translate: "Hello world! How are you today?",
            source_language: "English",
            target_language: "Spanish",
        },
        stream: true,
    });

    templateExecutor.on("requestSent", (request) => {
        console.log("🚀 Translation request sent:");
        console.dir(request, { depth: null });
    });

    templateExecutor.on("streamChunk", (chunk: string) => {
        process.stdout.write(chunk);
    });

    return executionResult;
}

main()
    .then(() => {
        console.log("✅ Translation completed successfully.");
    })
    .catch((err) => {
        console.error("❌ An error occurred during translation:", err);
    });