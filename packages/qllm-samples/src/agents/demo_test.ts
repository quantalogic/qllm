import { Agent, AgentBuilder, createLLMProvider,RAGTool } from "qllm-lib"; 

async function main() {
  // Initialize the LLM provider
  const provider = createLLMProvider({ 
    name: 'openai',
    apiKey: process.env.OPENAI_API_KEY 
  });

  // Initialize the RAG tool
  const ragTool = new RAGTool('./docs', {
    embedModel: {
      type: 'openai',
      options: {
        modelType: 'text-embedding-ada-002'
      }
    },
    name: 'document_search',
    description: 'Search through project documentation',
    similarityTopK: 5
  });


  // Create the agent with the RAG tool
  const agent = AgentBuilder.create({
    role: "Research Assistant",
    goal: "Help users find information in documents",
    backstory: "An intelligent AI assistant specialized in document search and analysis"
  })
    .withProvider(provider)
    .withLLMOptions({
      model: "gpt-4",
      maxTokens: 1000,
      temperature: 0.7
    })
    .withTool(ragTool)
    .withMemory(true)
    .withSystemPrompt(`
      You are a research assistant that helps users find information in documents.
      When asked a question, use the document_search tool to find relevant information.
      Always cite your sources and provide context from the documents.
    `)
    .build();

  // Test queries
  const queries = [
    "What are the main topics discussed in the documents?",
    "tell me more about trump ?", 
  ];

  for (const query of queries) {
    console.log(`\nQuery: ${query}`);
    console.log("Response:");
    
    // Use streaming for real-time responses
    for await (const chunk of agent.streamChat(query)) {
      process.stdout.write(chunk);
    }
    console.log("\n---");
  }
}

main().catch(console.error);