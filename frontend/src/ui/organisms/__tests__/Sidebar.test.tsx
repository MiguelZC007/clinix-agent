import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import type * as I18nNav from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/hooks";
import { Sidebar } from "../Sidebar";

const mockLogout = vi.fn();
const mockUser = {
  id: "1",
  name: "María",
  lastName: "García",
  email: "maria@clinica.com",
  phone: "+123",
};
vi.mock("@/lib/auth/hooks", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/i18n/navigation", async () => {
  const actual = (await vi.importActual("@/i18n/navigation")) as typeof I18nNav;
  return {
    ...actual,
    usePathname: vi.fn(() => "/"),
  };
});

describe("Sidebar", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      isAuthenticated: true,
      isLoading: false,
      session: null,
      accessToken: "",
    });
  });

  it("renderiza correctamente", () => {
    render(<Sidebar />);
    expect(screen.getByRole("complementary")).toBeInTheDocument();
  });

  it("muestra logo expandido por defecto", () => {
    render(<Sidebar />);
    expect(screen.getByText("Clínica San Miguel")).toBeInTheDocument();
  });

  it("con collapsed=false tiene ancho completo", () => {
    render(<Sidebar collapsed={false} />);
    const aside = screen.getByRole("complementary");
    expect(aside).toHaveClass("w-64");
  });

  it("con collapsed=true tiene ancho reducido y navegacion presente", () => {
    render(<Sidebar collapsed={true} />);
    const aside = screen.getByRole("complementary");
    expect(aside).toHaveClass("w-16");
    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
  });

  it("muestra items de navegacion", () => {
    render(<Sidebar />);
    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
  });

  it("aplica className personalizada expandido", () => {
    const { container } = render(<Sidebar className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("aplica className personalizada colapsado", () => {
    const { container } = render(
      <Sidebar collapsed={true} className="custom-class" />,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("solo resalta la opcion activa: dashboard no activo cuando pathname no es raiz", () => {
    vi.mocked(usePathname).mockReturnValue("/patients");
    render(<Sidebar collapsed={false} />);
    const dashboardLink = screen.getByRole("link", {
      name: "Dashboard",
    });
    expect(dashboardLink).not.toHaveClass("bg-sidebar-accent");
  });

  it("muestra nombre y email del usuario de sesión cuando hay user", () => {
    render(<Sidebar collapsed={false} />);
    expect(screen.getByText("María García")).toBeInTheDocument();
    expect(screen.getByText("maria@clinica.com")).toBeInTheDocument();
  });

  it("no muestra Dr. Usuario ni doctor@clinica.com cuando user es null", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      logout: mockLogout,
      isAuthenticated: false,
      isLoading: false,
      session: null,
      accessToken: "",
    });
    render(<Sidebar collapsed={false} />);
    expect(screen.queryByText("Dr. Usuario")).not.toBeInTheDocument();
    expect(screen.queryByText("doctor@clinica.com")).not.toBeInTheDocument();
  });
});
