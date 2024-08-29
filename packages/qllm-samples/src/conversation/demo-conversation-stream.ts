import { createConversationManager } from "qllm-lib" 
import { ChatMessage, ChatMessageContent, LLMProvider } from "qllm-lib"
import { createLLMProvider } from "qllm-lib";

async function main() {
  // Initialize the ConversationManager
  const conversationManager = createConversationManager();

  // Initialize the OpenAI provider
  const openaiProvider: LLMProvider = createLLMProvider({name: "openai"})

  // Create a new conversation
  const conversation = await conversationManager.createConversation({
    metadata: {
      title: "Chat with OpenAI",
      description: "A conversation using the OpenAI provider"
    },
    initialMessage: "Hello, I'd like to discuss artificial intelligence.",
    providerIds: ["openai"]
  });

  console.log(`Created conversation with ID: ${conversation.id}`);

  // Function to add a user message and get AI response
  async function chatTurn(userMessage: string) {
    // Add user message to the conversation
    await conversationManager.addMessage(conversation.id, {
      role: 'user',
      content: { type: 'text', text: userMessage },
      providerId: "openai"
    });

    // Get the conversation history
    const history = await conversationManager.getHistory(conversation.id);

    // Prepare messages for the LLM
    const messages: ChatMessage[] = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    console.log("User:", userMessage);
    console.log("AI:", "");

    // Generate AI response using streaming
    let fullResponse = "";
    for await (const chunk of openaiProvider.streamChatCompletion({
      messages,
      options: {
        model: "gpt-4",
        maxTokens: 150
      }
    })) {
      if (chunk.text) {
        process.stdout.write(chunk.text);
        fullResponse += chunk.text;
      }
    }
    console.log("\n---");

    // Add AI response to the conversation
    await conversationManager.addMessage(conversation.id, {
      role: 'assistant',
      content: { type: 'text', text: fullResponse || "Sorry, I couldn't generate a response." },
      providerId: "openai"
    });
  }

  // Simulate a conversation
  await chatTurn("What are some recent advancements in AI?");
  await chatTurn("How might these advancements impact the job market?");
  await chatTurn("What ethical considerations should we keep in mind with AI development?");
  await chatTurn("What are my first question about ?");

  // Print the final conversation history
  const finalHistory = await conversationManager.getHistory(conversation.id);
  console.log("Final Conversation History:");

  const displayMessageContent = (msg: ChatMessageContent): string => {
    if(Array.isArray(msg)) {
      return msg.map(displayMessageContent).join(" ");
    }
    if(msg.type === "text") {
      return msg.text;
    }
    return "";
  }
  finalHistory.forEach(msg => {
    console.log(`${msg.role.toUpperCase()}: ${displayMessageContent(msg.content)}`);
  });
}

main().catch(console.error);