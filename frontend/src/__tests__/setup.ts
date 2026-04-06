import React from "react";
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll, vi } from "vitest";
import esMessages from "@/messages/es.json";
import { server } from "./mocks/server";

function getNestedMessage(messages: Record<string, unknown>, key: string) {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }

    return undefined;
  }, messages);
}

function interpolateMessage(
  message: string,
  values?: Record<string, string | number>,
) {
  if (!values) return message;

  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    message,
  );
}

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

type LinkProps = { children: React.ReactNode; href: string } & Record<
  string,
  unknown
>;

vi.mock("next-intl/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/",
  Link: ({ children, href, ...props }: LinkProps) => {
    return React.createElement("a", { href, ...props }, children);
  },
  createNavigation: () => ({
    useRouter: () => mockRouter,
    usePathname: () => "/",
    Link: ({ children, href, ...props }: LinkProps) => {
      return React.createElement("a", { href, ...props }, children);
    },
  }),
}));

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

global.ResizeObserver = vi.fn().mockImplementation(function ResizeObserver() {
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
});

vi.mock("next-intl", async () => {
  const actual = await vi.importActual("next-intl");
  return {
    ...actual,
    useTranslations:
      () => (key: string, values?: Record<string, string | number>) => {
        const resolved = getNestedMessage(
          esMessages as Record<string, unknown>,
          key,
        );

        if (typeof resolved !== "string") {
          return key;
        }

        return interpolateMessage(resolved, values);
      },
    useLocale: () => "es",
  };
});
