import { CommandContext } from "../command-processor";
import { IOManager } from "../io-manager";
import { ConversationMessage, ChatMessageContent, LLMOptions } from "qllm-lib";

const MESSAGES_PER_PAGE = 5;
const MAX_CONTENT_LENGTH = 100;

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

    displayConversationSummary(conversation, ioManager);

    let currentPage = 1;
    let filter: string | null = null;
    let expandedMessageIndex: number | null = null;

    while (true) {
      displayMessages(
        messages,
        currentPage,
        filter,
        expandedMessageIndex,
        ioManager
      );
      const action = await promptForAction(ioManager);

      switch (action) {
        case "next":
          if (currentPage * MESSAGES_PER_PAGE < messages.length) currentPage++;
          expandedMessageIndex = null;
          break;
        case "prev":
          if (currentPage > 1) currentPage--;
          expandedMessageIndex = null;
          break;
        case "filter":
          filter = await promptForFilter(ioManager);
          currentPage = 1;
          expandedMessageIndex = null;
          break;
        case "expand":
          expandedMessageIndex = await promptForExpand(
            ioManager,
            messages.length
          );
          break;
        case "exit":
          return;
      }
    }
  } catch (error) {
    ioManager.displayError(
      `Failed to display conversation: ${(error as Error).message}`
    );
  }
}

function displayConversationSummary(
  conversation: any,
  ioManager: IOManager
): void {
  ioManager.displaySectionHeader(`Conversation: ${conversation.id}`);
  ioManager.displayInfo(
    `Title: ${ioManager.colorize(
      conversation.metadata.title || "Untitled",
      "cyan"
    )}`
  );
  ioManager.displayInfo(
    `Created: ${ioManager.colorize(
      conversation.metadata.createdAt.toLocaleString(),
      "yellow"
    )}`
  );
  ioManager.displayInfo(
    `Updated: ${ioManager.colorize(
      conversation.metadata.updatedAt.toLocaleString(),
      "yellow"
    )}`
  );
  ioManager.displayInfo(
    `Messages: ${ioManager.colorize(
      conversation.messages.length.toString(),
      "green"
    )}`
  );
  ioManager.newLine();
}

function displayMessages(
  messages: ConversationMessage[],
  page: number,
  filter: string | null,
  expandedIndex: number | null,
  ioManager: IOManager
): void {
  const startIndex = (page - 1) * MESSAGES_PER_PAGE;
  const endIndex = startIndex + MESSAGES_PER_PAGE;
  const filteredMessages = filter
    ? messages.filter((m) => m.role === filter || m.providerId === filter)
    : messages;
  const displayedMessages = filteredMessages.slice(startIndex, endIndex);

  displayedMessages.forEach((message, index) => {
    const globalIndex = startIndex + index;
    displayMessage(
      message,
      globalIndex + 1,
      globalIndex === expandedIndex,
      ioManager
    );
    ioManager.displayInfo(ioManager.colorize("─".repeat(50), "dim"));
  });

  ioManager.displayInfo(
    `Page ${page} of ${Math.ceil(filteredMessages.length / MESSAGES_PER_PAGE)}`
  );
}

function displayMessage(
  message: ConversationMessage,
  index: number,
  isExpanded: boolean,
  ioManager: IOManager
): void {
  const roleColor = message.role === "user" ? "green" : "blue";
  const timestamp = message.timestamp
    ? ioManager.colorize(`[${message.timestamp.toLocaleTimeString()}]`, "dim")
    : "";

  ioManager.displayInfo(
    `${ioManager.colorize(`${index}.`, "cyan")} ${ioManager.colorize(
      message.role.toUpperCase(),
      roleColor
    )} ${timestamp}`
  );

  displayMessageContent(message.content, ioManager, isExpanded);

  if (message.providerId) {
    ioManager.displayInfo(
      `   Provider: ${ioManager.colorize(message.providerId, "magenta")}`
    );
  }

  if (message.options) {
    displayLLMOptions(message.options, ioManager);
  }
}

function displayMessageContent(
  content: ChatMessageContent,
  ioManager: IOManager,
  isExpanded: boolean,
  indent: string = "   "
): void {
  if (typeof content === "string") {
    displayTruncatedContent(content, ioManager, isExpanded, indent);
  } else if (Array.isArray(content)) {
    content.forEach((item) =>
      displayMessageContent(item, ioManager, isExpanded, indent + "   ")
    );
  } else if (content.type === "text") {
    displayTruncatedContent(content.text, ioManager, isExpanded, indent);
  } else if (content.type === "image_url") {
    ioManager.displayInfo(
      `${indent}${ioManager.colorize("[Image]", "yellow")} ${content.url}`
    );
  } else {
    ioManager.displayInfo(`${indent}${JSON.stringify(content, null, 2)}`);
  }
}

function displayTruncatedContent(
  content: string,
  ioManager: IOManager,
  isExpanded: boolean,
  indent: string
): void {
  if (isExpanded || content.length <= MAX_CONTENT_LENGTH) {
    ioManager.displayInfo(`${indent}${content}`);
  } else {
    const truncated = content.slice(0, MAX_CONTENT_LENGTH) + "...";
    ioManager.displayInfo(`${indent}${truncated}`);
    ioManager.displayInfo(
      `${indent}${ioManager.colorize(
        "[Content truncated. Use 'e' to expand]",
        "dim"
      )}`
    );
  }
}

function displayLLMOptions(
  options: Partial<LLMOptions>,
  ioManager: IOManager
): void {
  ioManager.displayInfo("   LLM Options:");
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      let displayValue = value;
      if (typeof value === "object") {
        displayValue = JSON.stringify(value);
      }
      ioManager.displayInfo(
        `      ${ioManager.colorize(key, "cyan")}: ${ioManager.colorize(
          String(displayValue),
          "yellow"
        )}`
      );
    }
  });
}

async function promptForAction(ioManager: IOManager): Promise<string> {
  while (true) {
    const input = await ioManager.getUserInput(
      "Enter action (n: next, p: prev, f: filter, e: expand, x: exit): "
    );

    switch (input.toLowerCase()) {
      case "n":
        return "next";
      case "p":
        return "prev";
      case "f":
        return "filter";
      case "e":
        return "expand";
      case "x":
        return "exit";
      default:
        ioManager.displayWarning("Invalid input. Please try again.");
      // The loop will continue, prompting the user again
    }
  }
}

async function promptForFilter(ioManager: IOManager): Promise<string | null> {
  const input = await ioManager.getUserInput(
    "Enter filter (user, assistant, provider name, or empty to clear): "
  );

  return input || null;
}

async function promptForExpand(
  ioManager: IOManager,
  messageCount: number
): Promise<number | null> {
  while (true) {
    const input = await ioManager.getUserInput(
      `Enter message number to expand (1-${messageCount}) or 'c' to cancel: `
    );

    if (input.toLowerCase() === "c") {
      return null;
    }

    const index = parseInt(input, 10) - 1;
    if (isNaN(index) || index < 0 || index >= messageCount) {
      ioManager.displayError("Invalid message number. Please try again.");
      // The loop will continue, prompting the user again
    } else {
      return index;
    }
  }
}
