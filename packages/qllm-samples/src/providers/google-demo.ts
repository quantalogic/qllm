import { z } from "zod";
import { getLLMProvider } from "qllm-lib";
import { LLMProvider, ChatMessage, Tool, ChatCompletionResponse } from "qllm-lib";
import { createFunctionToolFromZod } from "qllm-lib";

// Test configuration for Google Gemini models
const googleModels = {
    embeddingModelName: "", // Google doesn't support embeddings yet
    visionModelName: "gemini-1.0-pro-vision",
    toolModelName: "gemini-1.5-flash",
    textModelName: "gemini-1.5-flash",
};

const runGoogleTests = async () => {
    console.log("🚀 Starting Google Gemini Tests");

    await testListModels("google");
    await testLLMModel(
        "google",
        { maxTokens: 1024 },
        googleModels,
    );

    console.log("✅ Google Gemini Tests completed");
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
    await testCompletion(provider, {
        model: models.textModelName,
        maxTokens: options.maxTokens,
        stream: true,
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
    options: { model: string; maxTokens: number; stream?: boolean },
) {
    const isStream = options.stream ?? false;
    console.log(isStream ? "🌊 Testing streaming completion" : "📝 Testing basic completion");
    
    const messages: ChatMessage[] = [{
        role: "user",
        content: {
            type: "text",
            text: isStream 
                ? "Write a short poem about artificial intelligence."
                : "What are three interesting facts about quantum computing?",
        },
    }];

    const response = await provider.generateChatCompletion({
        options,
        messages,
    });

    console.log("Response:", response.text);
    console.log(isStream ? "✅ Streaming completion test completed" : "✅ Basic completion test completed");
}

async function testCompletionImage(
    provider: LLMProvider,
    options: { model: string; maxTokens: number },
) {
    console.log("🖼️ Testing image completion");
    const response = await provider.generateChatCompletion({
        options,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "What's in this image?",
                    },
                    {
                        type: "image_url",
                        url: "https://raw.githubusercontent.com/CompVis/stable-diffusion/main/assets/stable-samples/img2img/sketch-mountains-input.jpg",
                    },
                ],
            },
        ],
    });
    console.log("Response:", response.text);
    console.log("✅ Image completion test completed");
}

async function testCompletionWithTool(
    provider: LLMProvider,
    options: { model: string; maxTokens: number },
) {
    console.log("🛠️ Testing completion with tool");

    const weatherSchema = z.object({
        location: z.string().describe("The city and country to get weather for"),
        unit: z.enum(["celsius", "fahrenheit"]).describe("Temperature unit"),
    });

    const tools: Tool[] = [
        createFunctionToolFromZod({
            name: "get_weather",
            description: "Get the current weather in a location",
            schema: weatherSchema,
            strict: true,
        }),
    ];

    const response = await provider.generateChatCompletion({
        options,
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: "What's the weather like in Paris, France? Give me the temperature in celsius.",
                },
            },
        ],
        tools,
    });

    console.log("Response:", response.text);
    if (response.toolCalls) {
        console.log("Tool calls:", response.toolCalls);
    }
    console.log("✅ Tool completion test completed");
}

// Execute the Google Tests
runGoogleTests()
    .then(() => console.log("🎉 All Google Tests executed successfully"))
    .catch((error) => {
        console.error("❌ Error during tests:", error);
        process.exit(1);
    });