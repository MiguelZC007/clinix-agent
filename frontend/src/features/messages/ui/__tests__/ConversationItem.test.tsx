import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { MOCK_CONVERSATIONS } from "../../__mocks__/messages.mock";
import { ConversationItem } from "../ConversationItem";

describe("ConversationItem", () => {
  it("renderiza correctamente", () => {
    render(
      <ConversationItem
        conversation={MOCK_CONVERSATIONS[0]}
        isActive={false}
        onClick={vi.fn()}
      />,
    );
    const title =
      MOCK_CONVERSATIONS[0].title ?? MOCK_CONVERSATIONS[0].summary ?? "";
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it("renderiza como un button semántico", () => {
    render(
      <ConversationItem
        conversation={MOCK_CONVERSATIONS[0]}
        isActive={false}
        onClick={vi.fn()}
      />,
    );
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "button");
  });

  it("muestra estado activo con aria-current", () => {
    render(
      <ConversationItem
        conversation={MOCK_CONVERSATIONS[0]}
        isActive={true}
        onClick={vi.fn()}
      />,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-muted");
    expect(button).toHaveAttribute("aria-current", "true");
  });

  it("no establece aria-current cuando no está activo", () => {
    render(
      <ConversationItem
        conversation={MOCK_CONVERSATIONS[0]}
        isActive={false}
        onClick={vi.fn()}
      />,
    );
    const button = screen.getByRole("button");
    expect(button).not.toHaveAttribute("aria-current");
  });

  it("llama onClick al hacer click", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ConversationItem
        conversation={MOCK_CONVERSATIONS[0]}
        isActive={false}
        onClick={onClick}
      />,
    );

    const button = screen.getByRole("button");
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("se activa con Enter via teclado", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ConversationItem
        conversation={MOCK_CONVERSATIONS[0]}
        isActive={false}
        onClick={onClick}
      />,
    );

    const button = screen.getByRole("button");
    button.focus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("se activa con Space via teclado", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <ConversationItem
        conversation={MOCK_CONVERSATIONS[0]}
        isActive={false}
        onClick={onClick}
      />,
    );

    const button = screen.getByRole("button");
    button.focus();
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("tiene clases de focus-visible para accesibilidad", () => {
    render(
      <ConversationItem
        conversation={MOCK_CONVERSATIONS[0]}
        isActive={false}
        onClick={vi.fn()}
      />,
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("focus-visible:ring-2");
  });

  it("renderiza preview markdown sin enlaces ni imágenes interactivas", () => {
    render(
      <ConversationItem
        conversation={{
          ...MOCK_CONVERSATIONS[0],
          lastMessagePreview:
            "[Portal](https://example.com) ![img](https://example.com/a.png)",
        }}
        isActive={false}
        onClick={vi.fn()}
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Portal")).toBeInTheDocument();
  });
});
