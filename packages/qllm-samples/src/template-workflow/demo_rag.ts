import { RAGToolWithEmbedding } from 'qllm-lib';
import { writeFile } from 'fs/promises';
import path from 'path';



async function main(): Promise<void> {
    console.log("\n🔍 Starting RAG Search Demo");
  
    // Initialize the RAG tool
    const ragTool = new RAGToolWithEmbedding();
  
    try { 
      // Example 2: Using OpenAI embeddings
      console.log("\n📚 Running search with OpenAI embeddings...");
      const resultOpenAI = await ragTool.execute({
        directory: './docs',
        query: "Give me the main points discussed in my document, and improve them to have a better understanding of the topic, generate a full article",
        embedModel: "openai",
        topK: "5"
      });

      console.log("resultOpenAI : ", resultOpenAI)
  
      // Save OpenAI results
      if (resultOpenAI.success) {
        await writeFile(
          'results-openai.json', 
          JSON.stringify(resultOpenAI, null, 2), 
          'utf-8'
        );
        console.log("\n✅ OpenAI search results saved to results-openai.json");
        console.log("Found sources:", resultOpenAI.sources.length);
        console.log("Response:", resultOpenAI.response);
      } else {
        console.error("❌ OpenAI search failed:", resultOpenAI.error);
      }
  
      // Print tool definition for reference
      console.log("\n📋 Tool Definition:");
      console.log(JSON.stringify(ragTool.getDefinition(), null, 2));
  
    } catch (error) {
      console.error("\n❌ Error:", error);
      throw error;
    }
  }
  
  // Run the demo with error handling
  main().catch((error) => {
    console.error("\n💥 Fatal Error:", error);
    process.exit(1);
  });
