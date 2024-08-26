import { z } from "zod";

export const RunCommandOptionsSchema = z.object({
  type: z.enum(["file", "url", "inline"]).default("file"),
  variables: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  maxTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(1).optional(),
  stream: z.boolean().optional(),
  output: z.string().optional(),
});

export type RunCommandOptions = z.infer<typeof RunCommandOptionsSchema>;