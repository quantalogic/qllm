import { z } from "zod";
import { getEmbeddingProvider, getLLMProvider } from "qllm-lib";
import { EmbeddingProvider, LLMProvider } from "qllm-lib";
import { createFunctionToolFromZod } from "qllm-lib";

// LLM Tests

const runLLMTests = async () => {
    console.log("🚀 Starting LLM Tests");

    await testListModels("aws-anthropic");
    await testListModels("groq");
    await testListModels("ollama");
    await testListModels("openai");

    const awsAnthropicModels = {
        embeddingModelName: "",
        visionModelName: "anthropic.claude-3-haiku-20240307-v1:0",
        toolModelName: "anthropic.claude-3-haiku-20240307-v1:0",
        textModelName: "anthropic.claude-3-haiku-20240307-v1:0",
    };

    const groqModels = {
        embeddingModelName: "nomic-embed-text",
        visionModelName: "llama-3.1-70b-versatile",
        toolModelName: "llama3-groq-70b-8192-tool-use-preview",
        textModelName: "llama-3.1-70b-versatile",
    };

    const ollamaModels = {
        embeddingModelName: "nomic-embed-text:latest",
        visionModelName: "llava:latest",
        toolModelName: "mistral:latest",
        textModelName: "gemma2:2b",
    };

    const openaiModels = {
        embeddingModelName: "text-embedding-3-small",
        visionModelName: "gpt-4o-mini",
        toolModelName: "gpt-4o-mini",
        textModelName: "gpt-4o-mini",
    };

    await testLLMModel(
        "aws-anthropic",
        { maxTokens: 1024 },
        awsAnthropicModels,
    );
    await testLLMModel("groq", { maxTokens: 1024 }, groqModels);
    await testLLMModel("ollama", { maxTokens: 1024 }, ollamaModels);
    await testLLMModel("openai", { maxTokens: 1024 }, openaiModels);

    console.log("✅ LLM Tests completed");
};

const testListModels = async (providerName: string) => {
    console.log(`📋 Listing models for provider: ${providerName}`);
    const provider = await getLLMProvider(providerName);
    const models = await provider.listModels();
    console.log("📊 Available models:");
    console.dir(models, { depth: null });
    console.log("✅ Model listing completed");
};

const testLLMModel = async (
    providerName: string,
    options: { maxTokens: number },
    models: {
        embeddingModelName: string;
        visionModelName: string;
        toolModelName: string;
        textModelName: string;
    },
) => {
    console.log(`🧪 Testing LLM model with provider: ${providerName}`);

    const provider = await getLLMProvider(providerName);
    console.log(`🔧 ${providerName}Provider instance created`);

    await testCompletion(provider, {
        model: models.textModelName,
        maxTokens: options.maxTokens,
    });
    await testStream(provider, {
        model: models.textModelName,
        maxTokens: options.maxTokens,
    });
    await testCompletionImage(provider, {
        model: models.visionModelName,
        maxTokens: options.maxTokens,
    });
    await testCompletionWithTool(provider, {
        model: models.toolModelName,
        maxTokens: options.maxTokens,
    });

    console.log(`✅ LLM model test completed for ${providerName}`);
};

async function testCompletion(
    provider: LLMProvider,
    options: { model: string; maxTokens: number },
) {
    console.log("🔤 Starting text completion test");
    const result = await provider.generateChatCompletion({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: "What is the capital of France?",
                },
            },
        ],
        options: { model: options.model, maxTokens: options.maxTokens },
    });

    console.log("📝 Completion result:", result);
    console.log("✅ Text completion test completed");
}

async function testStream(
    provider: LLMProvider,
    options: { model: string; maxTokens: number },
) {
    console.log("🌊 Starting streaming completion test");
    const result = await provider.streamChatCompletion({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: "Write a small story about Paris. Less than 200 words.",
                },
            },
        ],
        options: { model: options.model, maxTokens: options.maxTokens },
    });

    console.log("📜 Streaming result:");
    for await (const message of result) {
        process.stdout.write(message.text || "");
    }
    console.log("\n✅ Streaming completion test completed");
}

async function testCompletionImage(
    provider: LLMProvider,
    options: { model: string; maxTokens: number },
) {
    console.log("🖼️ Starting image completion test");

    const urlDemo =
        "https://images.unsplash.com/photo-1613048981304-12e96c2d3ec4?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

    const result = await provider.generateChatCompletion({
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: "Can you describe this image?" },
                    { type: "image_url", url: urlDemo },
                ],
            },
        ],
        options: { model: options.model, maxTokens: options.maxTokens },
    });

    console.log("🎨 Image completion result:", result);
    console.log("✅ Image completion test completed");
}

async function testCompletionWithTool(
    provider: LLMProvider,
    options: { model: string; maxTokens: number },
) {
    console.log("🛠️ Starting completion with tool test");

    const weatherToolParameters = z.object({
        location: z
            .string()
            .describe("The city and state, e.g. San Francisco, CA"),
        unit: z
            .enum(["celsius", "fahrenheit"])
            .describe("The unit of temperature to use"),
    });

    const weatherTool = createFunctionToolFromZod({
        name: "get_current_weather",
        description: "Get the current weather in a given location",
        schema: weatherToolParameters,
        strict: true,
    });

    console.log("🌡️ Weather Tool created");

    const result = await provider.generateChatCompletion({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: "What is the Weather in Paris?",
                },
            },
        ],
        parallelToolCalls: true,
        toolChoice: "required",
        tools: [weatherTool],
        options: { model: options.model, maxTokens: options.maxTokens },
    });

    console.log("🔧 Tool completion result:");
    console.dir(result, { depth: null });
    console.log("✅ Completion with tool test completed");
}

// Embedding Tests
const runEmbeddingTests = async () => {
    console.log("🚀 Starting Embedding Tests");
    console.time("Total Embedding Tests Duration");

    const ollamaModels = {
        embeddingModelName: "nomic-embed-text:latest",
    };

    const openaiModels = {
        embeddingModelName: "text-embedding-3-small",
    };

    console.log("\n🔍 Testing Ollama Embedding Model");
    console.time("Ollama Test Duration");
    await testEmbeddingModel("ollama", {
        maxTokens: 1024,
        modelName: ollamaModels.embeddingModelName,
    });
    console.timeEnd("Ollama Test Duration");

    console.log("\n🔍 Testing OpenAI Embedding Model");
    console.time("OpenAI Test Duration");
    await testEmbeddingModel("openai", {
        maxTokens: 1024,
        modelName: openaiModels.embeddingModelName,
    });
    console.timeEnd("OpenAI Test Duration");

    console.timeEnd("Total Embedding Tests Duration");
    console.log("✅ Embedding Tests completed");
};

const testEmbeddingModel = async (
    providerName: string,
    options: { maxTokens: number; modelName: string },
) => {
    console.log(`🧪 Testing Embedding model with provider: ${providerName}`);
    const embeddingProvider = await getEmbeddingProvider(providerName);
    console.log(`🔧 ${providerName}Provider instance created for embedding`);
    await testEmbedding(embeddingProvider, {
        model: options.modelName,
        maxTokens: options.maxTokens,
    });
    console.log(`✅ Embedding model test completed for ${providerName}`);
};

async function testEmbedding(
    provider: EmbeddingProvider,
    options: { model: string; maxTokens: number },
) {
    console.log("🧬 Starting embedding generation");
    const content = "Hello, world!";
    const model = options.model;
    const result = await provider.generateEmbedding({ model, content });
    console.log("🔢 Embedding result:", result);
    console.log("✅ Embedding generation completed");
}

// Execute the LLM Tests
runLLMTests()
    .then(() => console.log("🎉 All LLM Tests executed successfully"))
    .catch((error) =>
        console.error("❌ Error during LLM tests execution:", error),
    )
    .then(() => {
        // Execute the Embedding Tests
        runEmbeddingTests()
            .then(() =>
                console.log("🎉 All Embedding Tests executed successfully"),
            )
            .catch((error) =>
                console.error(
                    "❌ Error during Embedding Tests execution:",
                    error,
                ),
            );
    });
