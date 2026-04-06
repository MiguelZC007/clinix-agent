import { z } from 'zod';

export const sendWhatsAppMessageRequestSchema = z.object({
  to: z.string(),
  body: z.string(),
});

export type SendWhatsAppMessageRequest = z.infer<typeof sendWhatsAppMessageRequestSchema>;

export const whatsAppMessageResponseSchema = z.object({
  messageSid: z.string(),
  status: z.string(),
  to: z.string(),
  from: z.string(),
  body: z.string(),
  dateCreated: z.string(),
});

export type WhatsAppMessageResponse = z.infer<typeof whatsAppMessageResponseSchema>;

export const messageStatusResponseSchema = z.object({
  sid: z.string(),
  status: z.string(),
  to: z.string(),
  from: z.string(),
  body: z.string(),
  dateCreated: z.string(),
  dateSent: z.string().optional(),
  dateUpdated: z.string().optional(),
  price: z.string().optional(),
  priceUnit: z.string().optional(),
});

export type MessageStatusResponse = z.infer<typeof messageStatusResponseSchema>;
