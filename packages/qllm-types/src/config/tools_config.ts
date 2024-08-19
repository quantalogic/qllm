import { z } from 'zod';

// Define a Zod schema for the tools
const ToolSchema = z.object({
  type: z.literal('function'),
  function: z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.record(z.unknown()),
  }),
});

export const ToolsArraySchema = z.array(ToolSchema);
