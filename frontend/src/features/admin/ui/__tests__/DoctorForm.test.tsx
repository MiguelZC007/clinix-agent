import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/__tests__/test-utils";
import userEvent from "@testing-library/user-event";
import { DoctorForm, type DoctorFormRef } from "../DoctorForm";

vi.mock("@/lib/auth/hooks", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/lib/auth/hooks";

const ADMIN_USER = {
  id: "admin-user-id",
  name: "Admin",
  lastName: "User",
  phone: "+1234567890",
  email: "admin@example.com",
  role: "ADMIN" as const,
};

const mockSpecialties = [
  { id: "spec-1", name: "Cardiología" },
  { id: "spec-2", name: "Pediatría" },
];

const baseDoctorWithRole = {
  id: "doctor-1",
  userId: "other-user-id",
  name: "Carlos",
  lastName: "García",
  email: "carlos@example.com",
  phone: "+584241234567",
  specialtyId: "spec-1",
  specialtyName: "Cardiología",
  licenseNumber: "MP-12345",
  isActive: true,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  role: "DOCTOR" as const,
};

const baseDoctorWithoutRole = {
  ...baseDoctorWithRole,
  role: undefined,
};

describe("DoctorForm — role-change intent (edit mode, role supported)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      session: { user: ADMIN_USER, accessToken: "token", expires: "" },
      user: ADMIN_USER,
      accessToken: "token",
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
  });

  it("muestra el selector de rol en modo edit cuando el doctor tiene role", () => {
    render(
      <DoctorForm
        doctor={baseDoctorWithRole}
        specialties={mockSpecialties}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        mode="edit"
      />
    );
    expect(screen.getByTestId("select-role")).toBeInTheDocument();
  });

  it("llama onSubmit con roleChange cuando el rol cambia", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <DoctorForm
        doctor={baseDoctorWithRole}
        specialties={mockSpecialties}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        mode="edit"
      />
    );

    // Change role to ADMIN
    const roleSelect = screen.getByTestId("select-role");
    await user.click(roleSelect);
    const adminOption = screen.getByTestId("role-option-ADMIN");
    await user.click(adminOption);

    // Submit the form
    const submitBtn = screen.getByTestId("btn-submit");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          roleChange: { from: "DOCTOR", to: "ADMIN" },
        })
      );
    });
  });
});

describe("DoctorForm — self-demotion blocking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      session: { user: ADMIN_USER, accessToken: "token", expires: "" },
      user: ADMIN_USER,
      accessToken: "token",
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
  });

  it("bloquea el submit cuando el admin intenta democrarse a sí mismo", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const selfAdminDoctor = {
      ...baseDoctorWithRole,
      userId: "admin-user-id",
      role: "ADMIN" as const,
    };

    render(
      <DoctorForm
        doctor={selfAdminDoctor}
        specialties={mockSpecialties}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        mode="edit"
      />
    );

    // Change role to DOCTOR (self-demotion)
    const roleSelect = screen.getByTestId("select-role");
    await user.click(roleSelect);
    const doctorOption = screen.getByTestId("role-option-DOCTOR");
    await user.click(doctorOption);

    // Self-demotion warning should be shown
    expect(screen.getByTestId("self-demotion-warning")).toBeInTheDocument();

    // Submit button should be disabled
    const submitBtn = screen.getByTestId("btn-submit");
    expect(submitBtn).toBeDisabled();
  });
});

describe("DoctorForm — submit without confirmation for non-role edits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      session: { user: ADMIN_USER, accessToken: "token", expires: "" },
      user: ADMIN_USER,
      accessToken: "token",
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
  });

  it("llama onSubmit sin roleChange cuando solo se edita el nombre", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <DoctorForm
        doctor={baseDoctorWithRole}
        specialties={mockSpecialties}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        mode="edit"
      />
    );

    // Edit name only
    const nameInput = screen.getByTestId("input-name");
    await user.clear(nameInput);
    await user.type(nameInput, "Nuevo Nombre");

    const submitBtn = screen.getByTestId("btn-submit");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.not.objectContaining({ roleChange: expect.anything() })
      );
    });
  });
});

describe("DoctorForm — degraded edit flow when backend returns no role", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      session: { user: ADMIN_USER, accessToken: "token", expires: "" },
      user: ADMIN_USER,
      accessToken: "token",
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
  });

  it("no muestra el selector de rol cuando el doctor no tiene role", () => {
    render(
      <DoctorForm
        doctor={baseDoctorWithoutRole}
        specialties={mockSpecialties}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        mode="edit"
      />
    );
    // RoleSelector should show unsupported message, NOT active selector
    expect(screen.queryByTestId("role-option-ADMIN")).not.toBeInTheDocument();
    expect(screen.getByTestId("role-unsupported-message")).toBeInTheDocument();
  });

  it("permite el submit de otros campos aunque role no esté soportado", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <DoctorForm
        doctor={baseDoctorWithoutRole}
        specialties={mockSpecialties}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        mode="edit"
      />
    );

    const nameInput = screen.getByTestId("input-name");
    await user.clear(nameInput);
    await user.type(nameInput, "Nuevo");

    const submitBtn = screen.getByTestId("btn-submit");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Nuevo" })
      );
    });
  });
});

describe("DoctorForm — imperative role reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      session: { user: ADMIN_USER, accessToken: "token", expires: "" },
      user: ADMIN_USER,
      accessToken: "token",
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
  });

  it("restaura el rol original cuando se invoca resetRole desde el ref", async () => {
    const user = userEvent.setup();
    const formRef = React.createRef<DoctorFormRef>();

    render(
      <DoctorForm
        ref={formRef}
        doctor={baseDoctorWithRole}
        specialties={mockSpecialties}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        mode="edit"
      />
    );

    const roleSelect = screen.getByTestId("select-role");
    expect(roleSelect).toHaveTextContent("Doctor");

    await user.click(roleSelect);
    await user.click(screen.getByTestId("role-option-ADMIN"));

    await waitFor(() => {
      expect(screen.getByTestId("select-role")).toHaveTextContent("Admin");
    });

    formRef.current?.resetRole();

    await waitFor(() => {
      expect(screen.getByTestId("select-role")).toHaveTextContent("Doctor");
    });
  });
});
