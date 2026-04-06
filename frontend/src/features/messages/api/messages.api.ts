import { z } from "zod";
import { client } from "@/lib/api/client";
import { ApiResponseSchema } from "@/types/contracts/api-response";
import type { PaginatedData } from "@/types/contracts/api-response";
import {
  messageEntitySchema,
  conversationSchema,
} from "../schemas/message.schema";
import type {
  Message,
  Conversation,
  SendMessageRequest,
} from "../types/message.types";

const CONVERSATIONS_ENDPOINT = "/conversations";
const MESSAGES_ENDPOINT = "/messages";

const conversationsArrayResponseSchema = z
  .object({
    success: z.boolean(),
    data: z.array(conversationSchema),
    timestamp: z.string().optional(),
  })
  .transform((res) => ({
    items: res.data,
    total: res.data.length,
    page: 1,
    pageSize: res.data.length,
    totalPages: res.data.length > 0 ? 1 : 0,
  }));

const messagesArrayResponseSchema = z
  .object({
    success: z.boolean(),
    data: z.array(messageEntitySchema),
    timestamp: z.string().optional(),
  })
  .transform((res) => ({
    items: res.data,
    total: res.data.length,
    page: 1,
    pageSize: res.data.length,
    totalPages: res.data.length > 0 ? 1 : 0,
  }));

export async function getConversations(): Promise<PaginatedData<Conversation>> {
  return client.get(CONVERSATIONS_ENDPOINT, conversationsArrayResponseSchema);
}

export async function getConversation(
  conversationId: string,
): Promise<Conversation> {
  const response = await client.get(
    `${CONVERSATIONS_ENDPOINT}/${conversationId}`,
    ApiResponseSchema(conversationSchema),
  );
  return response.data;
}

export async function createConversation(): Promise<Conversation> {
  const response = await client.post(
    CONVERSATIONS_ENDPOINT,
    {},
    ApiResponseSchema(conversationSchema),
  );
  return response.data;
}

export async function getMessages(
  conversationId: string,
): Promise<PaginatedData<Message>> {
  return client.get(
    `${CONVERSATIONS_ENDPOINT}/${conversationId}${MESSAGES_ENDPOINT}`,
    messagesArrayResponseSchema,
  );
}

export async function sendMessage(data: SendMessageRequest): Promise<Message> {
  const payload = {
    conversationId: data.conversationId,
    role: "user" as const,
    type: "text" as const,
    content: data.content,
  };

  const response = await client.post(
    MESSAGES_ENDPOINT,
    payload,
    ApiResponseSchema(messageEntitySchema),
  );
  return response.data;
}

export async function patchConversation(
  conversationId: string,
  _data: Record<string, never>,
): Promise<Conversation> {
  const response = await client.patch(
    `${CONVERSATIONS_ENDPOINT}/${conversationId}`,
    {},
    ApiResponseSchema(conversationSchema),
  );
  return response.data;
}

export async function markAsRead(conversationId: string): Promise<void> {
  await client.put(
    `${CONVERSATIONS_ENDPOINT}/${conversationId}/read`,
    {},
    z.object({
      success: z.boolean(),
      data: z.unknown().optional(),
      timestamp: z.string().optional(),
    }),
  );
}
