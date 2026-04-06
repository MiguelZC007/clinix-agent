import { z } from "zod";

export const messageStatusSchema = z.enum([
  "sending",
  "sent",
  "delivered",
  "read",
]);
export type MessageStatus = z.infer<typeof messageStatusSchema>;

export const conversationSchema = z.object({
  id: z.string(),
  model: z.string(),
  systemPrompt: z.string(),
  summary: z.string().optional(),
  lastActivityAt: z.coerce.date(),
  isActive: z.boolean(),
  doctorId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  contextTokensUsed: z.number(),
  contextTokenLimit: z.number(),
  title: z.string().optional(),
  lastMessagePreview: z.string().optional(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const messageEntitySchema = z.object({
  id: z.string(),
  conversationId: z.string().optional(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  tokenCount: z.number(),
  readAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Message = z.infer<typeof messageEntitySchema>;

export const messageFormSchema = z.object({
  content: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().min(1, "errors.required").max(1000, "errors.maxLength")),
});
export type MessageFormData = z.infer<typeof messageFormSchema>;
