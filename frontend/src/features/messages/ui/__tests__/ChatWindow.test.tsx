import { beforeAll, describe, it, expect, vi } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
} from "../../__mocks__/messages.mock";
import { ChatWindow } from "../ChatWindow";

// jsdom does not implement scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("ChatWindow", () => {
  const defaultProps = {
    conversation: MOCK_CONVERSATIONS[0],
    messages: MOCK_MESSAGES["1"],
    currentUserId: "doctor-1",
    onSendMessage: vi.fn(),
    isSending: false,
    isLoadingMessages: false,
  };

  it("muestra placeholder cuando no hay conversación activa", () => {
    render(<ChatWindow {...defaultProps} conversation={null} messages={[]} />);
    expect(
      screen.getByText("Selecciona una conversación para comenzar"),
    ).toBeInTheDocument();
  });

  it("botón de volver tiene aria-label localizado", () => {
    const onBack = vi.fn();
    render(<ChatWindow {...defaultProps} onBack={onBack} />);

    const backButton = screen.getByRole("button", { name: "Volver" });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute("aria-label", "Volver");
  });

  it("no renderiza botón de volver sin callback onBack", () => {
    render(<ChatWindow {...defaultProps} />);
    expect(
      screen.queryByRole("button", { name: "Volver" }),
    ).not.toBeInTheDocument();
  });

  it("renderiza mensajes de la conversación", () => {
    render(<ChatWindow {...defaultProps} />);
    expect(
      screen.getByText("Buenos días, necesito consultar sobre un tratamiento"),
    ).toBeInTheDocument();
  });

  it("muestra indicador de escritura del asistente", () => {
    render(<ChatWindow {...defaultProps} isSending={true} />);
    expect(
      screen.getByText("El asistente está escribiendo..."),
    ).toBeInTheDocument();
  });

  it("deshabilita el input si falta currentUserId", () => {
    render(<ChatWindow {...defaultProps} currentUserId="" />);
    expect(
      screen.getByRole("textbox", { name: "Escribe un mensaje..." }),
    ).toBeDisabled();
  });
});
