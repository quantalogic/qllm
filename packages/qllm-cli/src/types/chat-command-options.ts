import { z } from "zod";
import { IOManager } from "../chat/io-manager";

const ChatCommandOptionsSchema = z.object({
  provider: z.string().optional(),
  model: z.string().optional(),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(1).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().optional(),
  presencePenalty: z.number().optional(),
  stopSequence: z.array(z.string()).optional(),
});

export type ChatCommandOptions = z.infer<typeof ChatCommandOptionsSchema>;

export async function validateChatCommandOptions(
  options: unknown,
  ioManager: IOManager
): Promise<Partial<ChatCommandOptions>> {
  try {
    // Attempt to parse and validate the options
    const validatedOptions = ChatCommandOptionsSchema.parse(options);
    return validatedOptions;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If it's a Zod validation error, we can provide more detailed information
      ioManager.displayError("Validation failed. Errors:");
      error.errors.forEach((err) => {
        ioManager.displayError(`- ${err.path.join(".")}: ${err.message}`);
      });

      // Ask the user if they want to continue with default values
      const continueWithDefaults = await ioManager.confirmAction(
        "Do you want to continue with default values for invalid options?"
      );

      if (continueWithDefaults) {
        // If user wants to continue, manually create a partial object with only the valid options
        const partialOptions: Partial<ChatCommandOptions> = {};
        Object.entries(options as Record<string, unknown>).forEach(
          ([key, value]) => {
            if (
              ChatCommandOptionsSchema.shape[key as keyof ChatCommandOptions]
            ) {
              try {
                const validatedValue =
                  ChatCommandOptionsSchema.shape[
                    key as keyof ChatCommandOptions
                  ].parse(value);
                partialOptions[key as keyof ChatCommandOptions] =
                  validatedValue as any;
              } catch {
                // If individual field validation fails, skip this field
              }
            }
          }
        );
        ioManager.displayWarning(
          "Continuing with partial options. Some values may be undefined or removed."
        );
        return partialOptions;
      } else {
        throw new Error("Chat command options validation failed");
      }
    } else {
      // If it's some other kind of error, re-throw it
      throw error;
    }
  }
}
