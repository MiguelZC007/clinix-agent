export type { Message, Conversation } from "../schemas/message.schema";

export type SendMessageRequest = {
  conversationId: string;
  content: string;
};
