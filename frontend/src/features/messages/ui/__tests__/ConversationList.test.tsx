import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { MOCK_CONVERSATIONS } from "../../__mocks__/messages.mock";
import { ConversationList } from "../ConversationList";

describe("ConversationList", () => {
  const defaultProps = {
    conversations: MOCK_CONVERSATIONS,
    activeConversationId: null,
    onSelectConversation: vi.fn(() => {}),
  };

  it("renderiza correctamente", () => {
    render(<ConversationList {...defaultProps} />);
    expect(screen.getByText("Mensajes")).toBeInTheDocument();
  });

  it("muestra conversaciones", () => {
    render(<ConversationList {...defaultProps} />);
    const title =
      MOCK_CONVERSATIONS[0].title ?? MOCK_CONVERSATIONS[0].summary ?? "";
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it("llama onSelectConversation al seleccionar", async () => {
    const user = userEvent.setup();
    const onSelectConversation = vi.fn(() => {});
    render(
      <ConversationList
        {...defaultProps}
        onSelectConversation={onSelectConversation}
      />,
    );

    const buttons = screen.getAllByRole("button");
    // First button is the "new conversation" button, rest are conversation items
    const conversationButton = buttons.find((btn) =>
      btn.textContent?.includes(
        MOCK_CONVERSATIONS[0].title ?? MOCK_CONVERSATIONS[0].summary ?? "",
      ),
    );
    expect(conversationButton).toBeDefined();
    await user.click(conversationButton!);

    expect(onSelectConversation).toHaveBeenCalledWith(MOCK_CONVERSATIONS[0]);
  });

  it("titulo tiene clases responsive para cabecera compacta", () => {
    render(<ConversationList {...defaultProps} />);
    const heading = screen.getByRole("heading", { name: "Mensajes" });
    expect(heading).toHaveClass("text-base", "md:text-lg");
  });
});
