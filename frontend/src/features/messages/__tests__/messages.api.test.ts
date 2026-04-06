import { describe, it, expect } from "vitest";
import { MOCK_CONVERSATIONS } from "../__mocks__/messages.mock";
import {
  getConversations,
  getConversation,
  getMessages,
  sendMessage,
  markAsRead,
  patchConversation,
} from "../api/messages.api";

describe("getConversations", () => {
  it("retorna lista de conversaciones paginada", async () => {
    const result = await getConversations();
    expect(result.items).toHaveLength(MOCK_CONVERSATIONS.length);
    expect(result.total).toBe(MOCK_CONVERSATIONS.length);
  });

  it("retorna conversaciones correctamente tipadas", async () => {
    const result = await getConversations();
    expect(result.items[0]).toHaveProperty("id");
    expect(result.items[0]).toHaveProperty("title");
    expect(result.items[0]).toHaveProperty("lastActivityAt");
    expect(result.items[0]).toHaveProperty("contextTokensUsed");
    expect(result.items[0]).toHaveProperty("contextTokenLimit");
  });
});

describe("getConversation", () => {
  it("retorna una conversacion por id con uso de contexto", async () => {
    const result = await getConversation("1");
    expect(result.id).toBe("1");
    expect(result.contextTokensUsed).toBe(1200);
    expect(result.contextTokenLimit).toBe(120_000);
  });

  it("lanza si la conversacion no existe", async () => {
    await expect(getConversation("999")).rejects.toThrow();
  });
});

describe("getMessages", () => {
  it("retorna mensajes de una conversacion", async () => {
    const result = await getMessages("1");
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0]).toHaveProperty("id");
    expect(result.items[0]).toHaveProperty("content");
    expect(result.items[0]).toHaveProperty("role");
  });

  it("retorna lista vacia si no hay mensajes", async () => {
    const result = await getMessages("999");
    expect(result.items).toHaveLength(0);
  });
});

describe("sendMessage", () => {
  it("envia mensaje de texto correctamente", async () => {
    const message = {
      conversationId: "1",
      content: "Nuevo mensaje",
    };

    const result = await sendMessage(message);
    expect(result.content).toBe("Nuevo mensaje");
    expect(result.role).toBe("user");
    expect(result.id).toBeDefined();
  });
});

describe("patchConversation", () => {
  it("retorna la conversacion sin cambios", async () => {
    const result = await patchConversation("1", {} as Record<string, never>);
    expect(result.id).toBe("1");
    expect(result.contextTokenLimit).toBe(120_000);
  });
});

describe("markAsRead", () => {
  it("marca conversacion como leida", async () => {
    await expect(markAsRead("1")).resolves.not.toThrow();
  });
});
