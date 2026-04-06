import { describe, it, expect } from "vitest";
import {
  messageStatusSchema,
  messageEntitySchema,
  conversationSchema,
  messageFormSchema,
} from "../schemas/message.schema";

describe("messageStatusSchema", () => {
  it("valida estados validos", () => {
    expect(messageStatusSchema.parse("sending")).toBe("sending");
    expect(messageStatusSchema.parse("sent")).toBe("sent");
    expect(messageStatusSchema.parse("delivered")).toBe("delivered");
    expect(messageStatusSchema.parse("read")).toBe("read");
  });

  it("rechaza estados invalidos", () => {
    expect(() => messageStatusSchema.parse("invalid")).toThrow();
  });
});

describe("messageEntitySchema", () => {
  const validMessage = {
    id: "1",
    conversationId: "1",
    role: "user" as const,
    content: "Hello",
    tokenCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("valida mensaje completo correctamente", () => {
    const result = messageEntitySchema.parse({
      ...validMessage,
      createdAt: validMessage.createdAt.toISOString(),
      updatedAt: validMessage.updatedAt.toISOString(),
    });
    expect(result.id).toBe("1");
    expect(result.content).toBe("Hello");
    expect(result.role).toBe("user");
  });

  it("acepta readAt opcional", () => {
    const messageWithReadAt = {
      ...validMessage,
      readAt: new Date().toISOString(),
      createdAt: validMessage.createdAt.toISOString(),
      updatedAt: validMessage.updatedAt.toISOString(),
    };
    expect(messageEntitySchema.parse(messageWithReadAt)).toBeDefined();
  });

  it("rechaza mensaje sin campos requeridos", () => {
    expect(() => messageEntitySchema.parse({})).toThrow();
  });
});

describe("conversationSchema", () => {
  const validConversation = {
    id: "1",
    model: "gpt-4o-mini",
    systemPrompt: "Eres el asistente.",
    lastActivityAt: new Date(),
    isActive: true,
    doctorId: "doctor-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    contextTokensUsed: 0,
    contextTokenLimit: 120_000,
  };

  it("valida conversacion completa correctamente", () => {
    const parsed = conversationSchema.parse({
      ...validConversation,
      lastActivityAt: validConversation.lastActivityAt.toISOString(),
      createdAt: validConversation.createdAt.toISOString(),
      updatedAt: validConversation.updatedAt.toISOString(),
    });
    expect(parsed.id).toBe("1");
    expect(parsed.model).toBe("gpt-4o-mini");
    expect(parsed.doctorId).toBe("doctor-1");
    expect(parsed.contextTokensUsed).toBe(0);
    expect(parsed.contextTokenLimit).toBe(120_000);
  });

  it("acepta campos opcionales", () => {
    const conversationWithOptional = {
      ...validConversation,
      summary: "Resumen",
      title: "Conversación 1 ene",
      lastActivityAt: validConversation.lastActivityAt.toISOString(),
      createdAt: validConversation.createdAt.toISOString(),
      updatedAt: validConversation.updatedAt.toISOString(),
    };
    expect(conversationSchema.parse(conversationWithOptional)).toBeDefined();
  });

  it("acepta lastMessagePreview opcional", () => {
    const withPreview = {
      ...validConversation,
      lastMessagePreview: "Gracias, ya quedó claro",
      lastActivityAt: validConversation.lastActivityAt.toISOString(),
      createdAt: validConversation.createdAt.toISOString(),
      updatedAt: validConversation.updatedAt.toISOString(),
    };
    const parsed = conversationSchema.parse(withPreview);
    expect(parsed.lastMessagePreview).toBe("Gracias, ya quedó claro");
  });

  it("rechaza conversacion sin contextTokensUsed o contextTokenLimit", () => {
    const missingTokenFields = {
      id: "1",
      model: "gpt-4o-mini",
      systemPrompt: "Eres el asistente.",
      lastActivityAt: new Date().toISOString(),
      isActive: true,
      doctorId: "doctor-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(() => conversationSchema.parse(missingTokenFields)).toThrow();
  });
});

describe("messageFormSchema", () => {
  const validFormData = {
    content: "Hello world",
  };

  it("valida formulario correctamente", () => {
    expect(messageFormSchema.parse(validFormData)).toEqual(validFormData);
  });

  it("rechaza contenido vacio", () => {
    expect(() => messageFormSchema.parse({ content: "" })).toThrow();
  });

  it("rechaza contenido muy largo", () => {
    expect(() =>
      messageFormSchema.parse({ content: "a".repeat(1001) }),
    ).toThrow();
  });
});
