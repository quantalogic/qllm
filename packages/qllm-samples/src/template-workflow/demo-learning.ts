import { createLLMProvider } from "qllm-lib";
import {
    TemplateDefinition,
    TemplateDefinitionBuilder,
    TemplateExecutor,
} from "qllm-lib";

async function main(): Promise<void> {
    const learningArticleGenerator = TemplateDefinitionBuilder.create({
        name: "📚 Impatient Learner's Guide Generator",
        version: "1.0.0",
        description: "🚀 Generate engaging learning content for quick mastery",
        author: "🤖 LearningAI",
        content: `
        ## Expert Profile Configuration

        You are a world-renowned expert in {{subject}} with:
        - Decades of practical experience
        - Strong academic background
        - Industry leadership position
        - Track record of mentoring impatient learners

        ## Article Generation Parameters

        Topic: {{subject}} for the Impatient: From Novice to Practitioner in Record Time
        Word Count: {{number_words}}
        Additional Requirements: {{additional_requirements}}

        ## Content Structure Requirements

        1. Assessment Phase:
        <assessment>
        - Subject matter expertise validation
        - Resource availability check
        - Learning path feasibility analysis
        </assessment>

        2. Chapter Content:
        <chapter>
        - Why: Motivation and real-world applications
        - What: Core concepts and principles
        - How: Practical implementation
        - When: Usage scenarios and best practices
        
        Include:
        - Practical examples (progressive complexity)
        - Interactive elements
        - Pro tips and shortcuts
        - Common pitfalls
        - Action items
        </chapter>

        3. Visual Elements:
        <diagrams>
        - Mermaid diagrams for complex concepts
        - Process flows
        - Relationship maps
        - State transitions
        </diagrams>

        ## Output Format

        <article>
        [Generated content following the structure above]
        </article>

        <next_steps>
        [Instructions for continuing if incomplete]
        </next_steps>

        END.
        `,
    })
        .withInputVariable(
            "subject",
            "string",
            "📚 The subject to be taught",
        )
        .withInputVariable(
            "number_words",
            "number",
            "📏 Target word count for the article",
        )
        .withInputVariable(
            "additional_requirements",
            "string",
            "➕ Any additional specific requirements",
        )
        .withOutputVariable("article", "string", {
            description: "📖 Generated article content",
        })
        .withOutputVariable("next_steps", "string", {
            description: "⏭️ Continuation instructions",
        })
        .withTags("📚 education", "🎓 learning", "⚡ quick mastery")
        .withCategories("🎯 Educational Content", "🤖 AI-Assisted Learning")
        .withModel("gpt-4")
        .withParameters({
            max_tokens: 2000,
            temperature: 0.7,
            top_p: 0.95,
            presence_penalty: 0.2,
            frequency_penalty: 0.3,
        })
        .withPromptType("📝 educational_content")
        .withTaskDescription(
            "🎯 Generate comprehensive, engaging learning content for impatient learners",
        )
        .build();

    console.log("🏗️ Generated Learning Article Template:");
    console.log(learningArticleGenerator);

    const result = await executeTemplate(learningArticleGenerator);
    console.log("🎉 Article generation result:");
    console.log(result);
}

async function executeTemplate(templateDefinition: TemplateDefinition) {
    const provider = createLLMProvider({ name: "openai" });
    const templateExecutor = new TemplateExecutor();
    const executionResult = templateExecutor.execute({
        template: templateDefinition,
        provider: provider,
        variables: {
            subject: "TypeScript",
            number_words: 1500,
            additional_requirements: "Focus on practical applications and modern development practices",
        },
        stream: true,
    });

    templateExecutor.on("requestSent", (request) => {
        console.log("🚀 Article generation request sent:");
        console.dir(request, { depth: null });
    });

    templateExecutor.on("streamChunk", (chunk: string) => {
        process.stdout.write(chunk);
    });

    return executionResult;
}

main()
    .then(() => {
        console.log("✅ Article generation completed successfully.");
    })
    .catch((err) => {
        console.error("❌ An error occurred during article generation:", err);
    });