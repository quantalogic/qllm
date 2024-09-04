import { CommandContext } from "../command-processor";

const helpGroups = [
    {
        title: "Chat Management",
        commands: [
            { command: "/stop", description: "Stop the chat session" },
            {
                command: "/clear",
                description: "Clear the current conversation",
            },
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
            {
                command: "/run <template>",
                description: "Run a predefined prompt template <template> can be an URL or a local file",
            },
            {
                command: "/save <file>",
                description: "Write the current conversation to a file <file> can be a local file"
            }
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

export function showHelp(
    args: string[],
    { ioManager }: CommandContext,
): Promise<void> {
    if (args.length > 0) {
        return showCommandHelp(args[0], { ioManager });
    }

    ioManager.displaySectionHeader("QLLM CLI Help");
    ioManager.newLine();

    helpGroups.forEach((group) => {
        ioManager.displayGroupHeader(group.title);
        group.commands.forEach((cmd) => {
            ioManager.displayInfo(
                `  ${ioManager.colorize(cmd.command, "cyan")} - ${cmd.description}`,
            );
        });
        ioManager.newLine();
    });

    ioManager.displayInfo(
        ioManager.colorize(
            "Tip: Use '/help <command>' for more detailed information about a specific command.",
            "yellow",
        ),
    );

    return Promise.resolve();
}

function showCommandHelp(
    command: string,
    { ioManager }: Pick<CommandContext, "ioManager">,
): Promise<void> {
    const allCommands = helpGroups.flatMap((group) => group.commands);
    const commandHelp = allCommands.find(
        (cmd) => cmd.command.split(" ")[0] === command,
    );

    if (commandHelp) {
        ioManager.displaySectionHeader(`Help: ${commandHelp.command}`);
        ioManager.displayInfo(`Description: ${commandHelp.description}`);
        ioManager.newLine();
        ioManager.displayInfo("Usage:");
        ioManager.displayInfo(
            `  ${ioManager.colorize(commandHelp.command, "cyan")}`,
        );
        
        // Add more detailed usage information for specific commands
        if (command === "run") {
            ioManager.newLine();
            ioManager.displayInfo("The run command allows you to execute predefined chat templates.");
            ioManager.displayInfo("Templates are predefined conversation starters or workflows.");
            ioManager.displayInfo("Example:");
            ioManager.displayInfo("  /run code-review");
            ioManager.newLine();
            ioManager.displayInfo("Available templates:");
            ioManager.displayInfo("  - code-review: Start a code review session");
            ioManager.displayInfo("  - brainstorm: Begin a brainstorming session");
            ioManager.displayInfo("  - debug: Initiate a debugging session");
            // Add more templates as they become available
        }
    } else {
        ioManager.displayError(`No help available for command: ${command}`);
    }

    return Promise.resolve();
}
