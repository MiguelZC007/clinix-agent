import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { MobileSidebar } from "../MobileSidebar";

const mockUser = {
  id: "1",
  name: "María",
  lastName: "García",
  email: "maria@clinica.com",
  phone: "+123",
};

vi.mock("@/lib/auth/hooks", () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    logout: vi.fn(),
    isAuthenticated: true,
    isLoading: false,
    session: null,
    accessToken: "",
  })),
}));

describe("MobileSidebar", () => {
  it("renderiza cuando esta abierto", async () => {
    render(<MobileSidebar open={true} onOpenChange={vi.fn()} />);
    expect(await screen.findByText("Clínica San Miguel")).toBeInTheDocument();
  });

  it("no renderiza cuando esta cerrado", () => {
    render(<MobileSidebar open={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByText("Clínica San Miguel")).not.toBeInTheDocument();
  });

  it("llama onOpenChange al cerrar", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<MobileSidebar open={true} onOpenChange={onOpenChange} />);
    const closeButton = await screen.findByRole("button", { name: "Cerrar" });
    await user.click(closeButton);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("usa textos accesibles localizados para navegación", async () => {
    render(<MobileSidebar open={true} onOpenChange={vi.fn()} />);

    expect(await screen.findByText("Navegación principal")).toBeInTheDocument();
    expect(
      screen.getByText("Navegación de la barra lateral de la aplicación"),
    ).toBeInTheDocument();
  });
});
