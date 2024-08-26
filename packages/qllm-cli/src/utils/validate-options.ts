import { z } from "zod";
import { IOManager } from "./io-manager";

export async function validateOptions<T extends z.ZodType>(
  schema: T,
  options: unknown,
  ioManager: IOManager
): Promise<Partial<z.infer<T>>> {
  try {
    // Attempt to parse and validate the options
    const validatedOptions = schema.parse(options);
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
        const partialOptions: Partial<z.infer<T>> = {};
        if (schema instanceof z.ZodObject) {
          Object.entries(options as Record<string, unknown>).forEach(
            ([key, value]) => {
              if (key in schema.shape) {
                try {
                  const fieldSchema = schema.shape[key as keyof z.infer<T>];
                  const validatedValue = fieldSchema.parse(value);
                  (partialOptions as any)[key] = validatedValue;
                } catch {
                  // If individual field validation fails, skip this field
                }
              }
            }
          );
        }
        ioManager.displayWarning(
          "Continuing with partial options. Some values may be undefined or removed."
        );
        return partialOptions;
      } else {
        throw new Error("Options validation failed");
      }
    } else {
      // If it's some other kind of error, re-throw it
      throw error;
    }
  }
}