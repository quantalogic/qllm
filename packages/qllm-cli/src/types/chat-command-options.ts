import { z } from "zod";

export const ChatCommandOptionsSchema = z.object({
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
