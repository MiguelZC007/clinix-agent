import { readFileSync } from "fs";
import { join } from "path";
import { describe, it, expect } from "vitest";

describe("Messages page responsive", () => {
  it("columna de lista usa anchos progresivos md:w-64 lg:w-80", () => {
    const pagePath = join(
      process.cwd(),
      "src",
      "app",
      "[locale]",
      "(dashboard)",
      "messages",
      "page.tsx",
    );
    const content = readFileSync(pagePath, "utf-8");
    expect(content).toContain("md:w-64");
    expect(content).toContain("lg:w-80");
  });
});

describe("Messages page text-only flow", () => {
  const pagePath = join(
    process.cwd(),
    "src",
    "app",
    "[locale]",
    "(dashboard)",
    "messages",
    "page.tsx",
  );
  const content = readFileSync(pagePath, "utf-8");

  it("refetch de conversaciones después de enviar mensaje", () => {
    expect(content).toContain("refetchConversations()");
  });

  it("re-throw del error para que MessageInput conserve el texto", () => {
    expect(content).toContain("throw _error");
  });

  it("no contiene referencias a audio ni grabación", () => {
    expect(content).not.toMatch(/audio/i);
    expect(content).not.toMatch(/record/i);
    expect(content).not.toMatch(/voice/i);
    expect(content).not.toMatch(/microphone/i);
  });
});
