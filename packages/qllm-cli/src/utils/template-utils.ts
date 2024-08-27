export function parseVariables(variablesString?: string): Record<string, any> {
  if (!variablesString) return {};
  try {
    return JSON.parse(variablesString);
  } catch (error) {
    throw new Error("Invalid JSON format for variables");
  }
}
