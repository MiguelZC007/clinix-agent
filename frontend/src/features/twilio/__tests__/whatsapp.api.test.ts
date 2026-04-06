import { describe, it, expect } from 'vitest';
import { sendWhatsAppMessage, getMessageStatus } from '../api/whatsapp.api';

describe('sendWhatsAppMessage', () => {
  it('envía mensaje y retorna messageSid y status', async () => {
    const result = await sendWhatsAppMessage({
      to: 'whatsapp:+59170000001',
      body: 'Mensaje de prueba',
    });
    expect(result.messageSid).toBeDefined();
    expect(typeof result.messageSid).toBe('string');
    expect(result.status).toBe('queued');
    expect(result.to).toBe('whatsapp:+59170000001');
    expect(result.body).toBe('Mensaje de prueba');
    expect(result.from).toBeDefined();
    expect(result.dateCreated).toBeDefined();
  });

  it('lanza error cuando el servidor responde 400', async () => {
    await expect(
      sendWhatsAppMessage({ to: '', body: 'test' })
    ).rejects.toThrow();
  });
});

describe('getMessageStatus', () => {
  it('retorna estado del mensaje por messageSid', async () => {
    const sent = await sendWhatsAppMessage({
      to: 'whatsapp:+59170000001',
      body: 'Test',
    });
    const result = await getMessageStatus(sent.messageSid);
    expect(result.sid).toBe(sent.messageSid);
    expect(result.status).toBe('delivered');
    expect(result.to).toBeDefined();
    expect(result.from).toBeDefined();
    expect(result.body).toBeDefined();
    expect(result.dateCreated).toBeDefined();
  });

  it('lanza error cuando messageSid es inválido', async () => {
    await expect(getMessageStatus('')).rejects.toThrow();
  });
});
