import { CommandContext } from "../command-processor";

export async function displayConversation(
  args: string[],
  { conversationManager, ioManager }: CommandContext
): Promise<void> {
  const conversationId = args[0];
  if (!conversationId) {
    ioManager.displayError("Please provide a conversation ID.");
    return;
  }

  try {
    const conversation = await conversationManager.getConversation(
      conversationId
    );
    const messages = conversation.messages;

    // Display conversation header
    ioManager.displayInfo(`Conversation ${conversationId}`);
    ioManager.displayInfo(
      `Title: ${conversation.metadata.title || "Untitled"}`
    );
    ioManager.displayInfo(
      `Created: ${conversation.metadata.createdAt.toLocaleString()}`
    );
    ioManager.displayInfo(
      `Updated: ${conversation.metadata.updatedAt.toLocaleString()}`
    );
    ioManager.displayInfo(`Messages: ${messages.length}`);
    ioManager.newLine();

    // Display messages
    messages.forEach((message, index) => {
      const roleColor = message.role === "user" ? "green" : "blue";
      const formattedContent = formatMessageContent(message.content);
      const timestamp = message.timestamp
        ? `[${message.timestamp.toLocaleTimeString()}] `
        : "";

      ioManager.displayInfo(`${index + 1}. ${message.role.toUpperCase()}`);
      ioManager.displayInfo(`   ${timestamp}${formattedContent}`);

      if (message.providerId) {
        ioManager.displayInfo(`   Provider: ${message.providerId}`);
      }

      if (index < messages.length - 1) {
        ioManager.newLine();
      }
    });
  } catch (error) {
    ioManager.displayError(
      `Failed to display conversation: ${(error as Error).message}`
    );
  }
}

function formatMessageContent(content: any): string {
  if (typeof content === "string") {
    return content;
  } else if (content.type === "text") {
    return content.text;
  } else if (content.type === "image_url") {
    return `[Image: ${content.url}]`;
  } else if (Array.isArray(content)) {
    return content.map((item) => formatMessageContent(item)).join("\n   ");
  } else {
    return JSON.stringify(content, null, 2);
  }
}
