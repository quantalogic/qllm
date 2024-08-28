import { createConversationManager } from '../../conversation';
import { ChatMessage, ChatMessageContent, LLMProvider } from '../../types';
import { createLLMProvider } from '../..';

async function main() {
  // Initialize the ConversationManager
  const conversationManager = createConversationManager();

  // Initialize the OpenAI provider
  const openaiProvider: LLMProvider = createLLMProvider({ name: 'openai' });

  // Create a new conversation
  const conversation = await conversationManager.createConversation({
    metadata: {
      title: 'Image Description with OpenAI',
      description: "A conversation about describing an image using OpenAI's vision capabilities",
    },
    initialMessage: "Let's analyze an image together.",
    providerIds: ['openai'],
  });

  console.log(`Created conversation with ID: ${conversation.id}`);

  // Function to add a user message and get AI response
  async function chatTurn(userMessage: string, imageUrl?: string) {
    // Prepare the message content
    let messageContent: ChatMessageContent;
    if (imageUrl) {
      messageContent = [
        { type: 'text', text: userMessage },
        { type: 'image_url', url: imageUrl },
      ];
    } else {
      messageContent = { type: 'text', text: userMessage };
    }

    // Add user message to the conversation
    await conversationManager.addMessage(conversation.id, {
      role: 'user',
      content: messageContent,
      providerId: 'openai',
    });

    // Get the conversation history
    const history = await conversationManager.getHistory(conversation.id);

    // Prepare messages for the LLM
    const messages: ChatMessage[] = history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    console.log('User:', userMessage);
    console.log('AI:', '');

    // Generate AI response using streaming
    let fullResponse = '';
    for await (const chunk of openaiProvider.streamChatCompletion({
      messages,
      options: {
        model: 'gpt-4o-mini',
        maxTokens: 300,
      },
    })) {
      if (chunk.text) {
        process.stdout.write(chunk.text);
        fullResponse += chunk.text;
      }
    }
    console.log('\n---');

    // Add AI response to the conversation
    await conversationManager.addMessage(conversation.id, {
      role: 'assistant',
      content: { type: 'text', text: fullResponse || "Sorry, I couldn't generate a response." },
      providerId: 'openai',
    });
  }

  // Simulate a conversation
  const imageUrl =
    'https://images.unsplash.com/photo-1592533125568-a46fcc583608?q=80&w=3774&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
  await chatTurn('What do you see in this image?', imageUrl);
  await chatTurn('What emotions or mood does this image evoke?');
  await chatTurn('Can you describe the lighting and color palette used in the image?');

  // Print the final conversation history
  const finalHistory = await conversationManager.getHistory(conversation.id);
  console.log('Final Conversation History:');

  const displayMessageContent = (msg: ChatMessageContent): string => {
    if (Array.isArray(msg)) {
      return msg.map(displayMessageContent).join(' ');
    }
    if (msg.type === 'text') {
      return msg.text;
    }
    if (msg.type === 'image_url') {
      return `[Image URL: ${msg.url}]`;
    }
    return '';
  };
  finalHistory.forEach((msg) => {
    console.log(`${msg.role.toUpperCase()}: ${displayMessageContent(msg.content)}`);
  });
}

main().catch(console.error);
