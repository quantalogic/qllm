import { Agent, AgentBuilder, createLLMProvider,RAGTool } from "qllm-lib"; 


async function main() {
    // Initialize the LLM provider
    const provider = createLLMProvider({ 
      name: 'openai',
      apiKey: process.env.OPENAI_API_KEY 
    });
  // Create agent with RAG tool
  const agent = await AgentBuilder.create({
    role: "Research Assistant",
    goal: "Help users find and analyze information from documents",
    backstory: "I am an AI assistant specialized in searching and analyzing documents"
  })
  .withTool(new RAGTool("./docs", {
    embedModel: {
      type: 'openai',
      options: {
        modelType: 'text-embedding-ada-002'
      }
    },
    similarityTopK: 3
  }))
  .withProvider(provider)
  .withLLMOptions({
    model: "gpt-4o-mini",
    maxTokens: 1000,
    temperature: 0.7
  })
  .withMemory(true)
  .build();

  // Test regular chat
  const response = await agent.chat("What are the main topics discussed in my documents ?");
  console.log("Regular response:", response);

  // Test streaming chat
  console.log("\nStreaming response:");
  for await (const chunk of agent.streamChat("What are the main topics discussed in my documents ?")) {
    process.stdout.write(chunk);
  }

  console.log("\nStreaming response:");
  for await (const chunk of agent.streamChat("tell me about trump ?")) {
    process.stdout.write(chunk);
  }
}

main().catch(console.error);