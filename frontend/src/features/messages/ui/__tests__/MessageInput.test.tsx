import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/__tests__/test-utils";
import { MessageInput } from "../MessageInput";

describe("MessageInput", () => {
  const defaultProps = {
    onSendMessage: vi.fn(),
    disabled: false,
  };

  it("renderiza correctamente", () => {
    render(<MessageInput {...defaultProps} />);
    expect(
      screen.getByPlaceholderText("Escribe un mensaje..."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Escribe un mensaje..." }),
    ).toBeInTheDocument();
  });

  it("muestra boton de enviar con aria-label accesible", () => {
    render(<MessageInput {...defaultProps} />);
    const sendButton = screen.getByRole("button", { name: "Enviar" });
    expect(sendButton).toBeInTheDocument();
  });

  it("boton de enviar esta deshabilitado cuando no hay texto", () => {
    render(<MessageInput {...defaultProps} />);
    const sendButton = screen.getByRole("button", { name: "Enviar" });
    expect(sendButton).toBeDisabled();
  });

  it("boton de enviar se habilita cuando hay texto", async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const input = screen.getByPlaceholderText("Escribe un mensaje...");
    await user.type(input, "Test message");

    const sendButton = screen.getByRole("button", { name: "Enviar" });
    expect(sendButton).not.toBeDisabled();
  });

  it("llama onSendMessage al enviar mensaje", async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

    const input = screen.getByPlaceholderText("Escribe un mensaje...");
    await user.type(input, "Test message");
    await user.keyboard("{Enter}");

    expect(onSendMessage).toHaveBeenCalledWith("Test message");
  });

  it("rechaza mensajes de solo espacios en blanco", async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn();
    render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

    const input = screen.getByPlaceholderText("Escribe un mensaje...");
    await user.type(input, "   ");

    const sendButton = screen.getByRole("button", { name: "Enviar" });
    expect(sendButton).toBeDisabled();
  });

  it("conserva el texto si onSendMessage falla", async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn().mockRejectedValue(new Error("network"));
    render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

    const input = screen.getByPlaceholderText("Escribe un mensaje...");
    await user.type(input, "important message");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(onSendMessage).toHaveBeenCalledWith("important message");
    });

    // Input should retain the text after failed send
    expect(input).toHaveValue("important message");
  });

  it("limpia el input despues de envio exitoso", async () => {
    const user = userEvent.setup();
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    render(<MessageInput {...defaultProps} onSendMessage={onSendMessage} />);

    const input = screen.getByPlaceholderText("Escribe un mensaje...");
    await user.type(input, "hello");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  it("no renderiza controles de audio", () => {
    render(<MessageInput {...defaultProps} />);
    expect(screen.queryByLabelText(/record/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/audio/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/voice/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/microphone/i)).not.toBeInTheDocument();
  });

  it("deshabilita input cuando disabled es true", () => {
    render(<MessageInput {...defaultProps} disabled={true} />);
    const input = screen.getByPlaceholderText("Escribe un mensaje...");
    expect(input).toBeDisabled();
  });

  it("input tiene maxLength de 1000 caracteres", () => {
    render(<MessageInput {...defaultProps} />);
    const input = screen.getByPlaceholderText("Escribe un mensaje...");
    expect(input).toHaveAttribute("maxLength", "1000");
  });

  it("muestra error visible cuando el contenido es solo espacios", async () => {
    const user = userEvent.setup();
    render(<MessageInput {...defaultProps} />);

    const input = screen.getByRole("textbox", {
      name: "Escribe un mensaje...",
    });
    await user.type(input, "   ");
    await user.tab();

    expect(
      await screen.findByText("Este campo es requerido"),
    ).toBeInTheDocument();
  });
});
