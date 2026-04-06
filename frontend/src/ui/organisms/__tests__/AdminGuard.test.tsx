import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import type * as I18nNav from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/hooks";
import { AdminGuard } from "../AdminGuard";

vi.mock("@/lib/auth/hooks", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/i18n/navigation", async () => {
  const actual = (await vi.importActual("@/i18n/navigation")) as typeof I18nNav;
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn() }),
  };
});

const mockUser = {
  id: "1",
  name: "Admin",
  lastName: "Test",
  email: "admin@test.com",
  phone: "+123",
  role: "ADMIN" as const,
};

describe("AdminGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra loading spinner mientras carga", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: undefined,
      isAuthenticated: false,
      isLoading: true,
      session: null,
      accessToken: "",
      logout: vi.fn(),
    });

    render(<AdminGuard><div>Contenido Admin</div></AdminGuard>);
    expect(screen.getByTestId("admin-guard-loading")).toBeInTheDocument();
  });

  it("renderiza children cuando el usuario es ADMIN", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      session: null,
      accessToken: "",
      logout: vi.fn(),
    });

    render(<AdminGuard><div>Contenido Admin</div></AdminGuard>);
    expect(screen.getByText("Contenido Admin")).toBeInTheDocument();
  });

  it("muestra mensaje de acceso denegado cuando el usuario no es ADMIN", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { ...mockUser, role: "DOCTOR" },
      isAuthenticated: true,
      isLoading: false,
      session: null,
      accessToken: "",
      logout: vi.fn(),
    });

    render(<AdminGuard><div>Contenido Admin</div></AdminGuard>);
    expect(screen.getByTestId("admin-guard-denied")).toBeInTheDocument();
    expect(screen.queryByText("Contenido Admin")).not.toBeInTheDocument();
  });

  it("muestra acceso denegado para usuario PATIENT", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { ...mockUser, role: "PATIENT" },
      isAuthenticated: true,
      isLoading: false,
      session: null,
      accessToken: "",
      logout: vi.fn(),
    });

    render(<AdminGuard><div>Contenido Admin</div></AdminGuard>);
    expect(screen.getByTestId("admin-guard-denied")).toBeInTheDocument();
  });

  it("no renderiza nada cuando no está autenticado", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: undefined,
      isAuthenticated: false,
      isLoading: false,
      session: null,
      accessToken: "",
      logout: vi.fn(),
    });

    const { container } = render(<AdminGuard><div>Contenido Admin</div></AdminGuard>);
    expect(container.innerHTML).toBe("");
  });

  it("muestra botón para volver al dashboard", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { ...mockUser, role: "DOCTOR" },
      isAuthenticated: true,
      isLoading: false,
      session: null,
      accessToken: "",
      logout: vi.fn(),
    });

    render(<AdminGuard><div>Contenido Admin</div></AdminGuard>);
    expect(screen.getByTestId("btn-back-to-dashboard")).toBeInTheDocument();
  });
});
