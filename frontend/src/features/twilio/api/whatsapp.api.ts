import { client } from '@/lib/api/client';
import { ApiResponseSchema } from '@/types/contracts/api-response';
import { whatsAppMessageResponseSchema, messageStatusResponseSchema } from '../schemas/whatsapp.schema';
import type { SendWhatsAppMessageRequest, WhatsAppMessageResponse, MessageStatusResponse } from '../types/whatsapp.types';

const ENDPOINT = '/twilio';

export async function sendWhatsAppMessage(data: SendWhatsAppMessageRequest): Promise<WhatsAppMessageResponse> {
  const response = await client.post(
    `${ENDPOINT}/whatsapp/send`,
    data,
    ApiResponseSchema(whatsAppMessageResponseSchema)
  );
  return response.data;
}

export async function getMessageStatus(messageSid: string): Promise<MessageStatusResponse> {
  const response = await client.get(
    `${ENDPOINT}/message/${messageSid}/status`,
    ApiResponseSchema(messageStatusResponseSchema)
  );
  return response.data;
}
