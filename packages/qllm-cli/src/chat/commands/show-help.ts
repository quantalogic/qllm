import { CommandContext } from "../command-processor";


export function showHelp(
    args: string[],
    { ioManager }: CommandContext
  ): Promise<void> {
    ioManager.displayTitle("Available Commands");

    const helpGroups = [
      {
        title: "Chat Management",
        commands: [
          { command: "/stop", description: "Stop the chat session" },
          { command: "/clear", description: "Clear the current conversation" },
          { command: "/new", description: "Start a new conversation" },
          {
            command: "/list",
            description: "Display all messages in the current conversation",
          },
          {
            command: "/conversations",
            description: "List all past conversations",
          },
          {
            command: "/display <id>",
            description: "Display a past conversation",
          },
          {
            command: "/select <id>",
            description: "Select a past conversation as current",
          },
          {
            command: "/delete <id>",
            description: "Delete a past conversation",
          },
          {
            command: "/deleteall",
            description: "Delete all past conversations",
          },
        ],
      },
      {
        title: "Model and Provider Settings",
        commands: [
          {
            command: "/models [provider]",
            description:
              "List available models (optionally for a specific provider)",
          },
          { command: "/providers", description: "List available providers" },
          { command: "/model <name>", description: "Set the model" },
          { command: "/provider <name>", description: "Set the provider" },
          { command: "/options", description: "Display current options" },
          { command: "/set <option> <value>", description: "Set an option" },
        ],
      },
      {
        title: "Image Handling",
        commands: [
          {
            command: "/image <url>",
            description: "Add an image to the current query",
          },
          {
            command: "/clearimages",
            description: "Clear all images from the buffer",
          },
          {
            command: "/listimages",
            description: "Display the list of images in the buffer",
          },
          {
            command: "/removeimage <url>",
            description: "Remove a specific image from the buffer",
          },
        ],
      },
      {
        title: "Help",
        commands: [{ command: "/help", description: "Show this help message" }],
      },
    ];

    helpGroups.forEach((group) => {
      ioManager.displaySectionHeader(group.title);
      const tableData = group.commands.map((cmd) => [
        cmd.command,
        cmd.description,
      ]);
      ioManager.displayTable(["Command", "Description"], tableData);
      ioManager.newLine();
    });

    ioManager.displayInfo(
      "Tip: You can use '/help <command>' for more detailed information about a specific command."
    );

    return Promise.resolve();
  }