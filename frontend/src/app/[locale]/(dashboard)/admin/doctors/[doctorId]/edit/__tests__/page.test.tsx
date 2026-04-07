import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@/__tests__/test-utils";

// Stable router mock — shared reference for push assertions
const mockRouterPush = vi.fn();

// Mock dependencies — must be declared before imports
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, back: vi.fn() }),
}));

vi.mock("@/features/appointments/api/appointments.api", () => ({
  getSpecialties: vi.fn().mockResolvedValue([
    { id: "spec-1", name: "Cardiología" },
  ]),
}));

vi.mock("@/features/admin/hooks/useDoctors", () => ({
  useDoctor: vi.fn(),
  useUpdateDoctor: vi.fn(),
}));

vi.mock("@/lib/auth/hooks", () => ({
  useAuth: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useDoctor, useUpdateDoctor } from "@/features/admin/hooks/useDoctors";
import { useAuth } from "@/lib/auth/hooks";
import { toast } from "sonner";
import { EditDoctorPageContent } from "../page.content";

const ADMIN_USER = {
  id: "admin-user-id",
  name: "Admin",
  lastName: "User",
  phone: "+1234567890",
  email: "admin@example.com",
  role: "ADMIN" as const,
};

const mockDoctorWithRole = {
  id: "doctor-1",
  userId: "other-user-id",
  email: "carlos@example.com",
  name: "Carlos",
  lastName: "García",
  phone: "+584241234567",
  specialtyId: "spec-1",
  specialtyName: "Cardiología",
  licenseNumber: "MP-12345",
  isActive: true,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  role: "DOCTOR" as const,
};

describe("EditDoctorPage — confirm-before-PATCH for role changes", () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouterPush.mockReset();

    vi.mocked(useAuth).mockReturnValue({
      session: { user: ADMIN_USER, accessToken: "token", expires: "" },
      user: ADMIN_USER,
      accessToken: "token",
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });

    vi.mocked(useDoctor).mockReturnValue({
      data: mockDoctorWithRole,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    vi.mocked(useUpdateDoctor).mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      error: null,
    });
  });

  it("muestra ConfirmDialog al intentar cambiar el rol", async () => {
    render(
      <EditDoctorPageContent
        doctorId="doctor-1"
        specialties={[{ id: "spec-1", name: "Cardiología" }]}
      />
    );

    // Change role to ADMIN
    const roleSelect = screen.getByTestId("select-role");
    fireEvent.click(roleSelect);
    const adminOption = await screen.findByTestId("role-option-ADMIN");
    fireEvent.click(adminOption);

    // Submit the form
    const submitBtn = screen.getByTestId("btn-submit");
    fireEvent.click(submitBtn);

    // ConfirmDialog should appear
    await waitFor(() => {
      expect(screen.getByText(/confirmar cambio de rol/i)).toBeInTheDocument();
    });

    // Mutate should NOT have been called yet
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("ejecuta PATCH solo después de confirmar el rol", async () => {
    mockMutate.mockResolvedValue({ ...mockDoctorWithRole, role: "ADMIN" });

    render(
      <EditDoctorPageContent
        doctorId="doctor-1"
        specialties={[{ id: "spec-1", name: "Cardiología" }]}
      />
    );

    // Change role
    const roleSelect = screen.getByTestId("select-role");
    fireEvent.click(roleSelect);
    const adminOption = await screen.findByTestId("role-option-ADMIN");
    fireEvent.click(adminOption);

    // Submit
    fireEvent.click(screen.getByTestId("btn-submit"));

    // Wait for confirm dialog
    await waitFor(() => {
      expect(screen.getByText(/confirmar cambio de rol/i)).toBeInTheDocument();
    });

    // Click confirm button (in the ConfirmDialog footer)
    const confirmBtn = screen.getByRole("button", { name: /confirmar cambio/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        "doctor-1",
        expect.objectContaining({ role: "ADMIN" })
      );
    });
  });

  it("muestra roleUpdateError toast cuando el backend rechaza el cambio de rol", async () => {
    mockMutate.mockRejectedValue(new Error("422 Unprocessable Entity"));

    render(
      <EditDoctorPageContent
        doctorId="doctor-1"
        specialties={[{ id: "spec-1", name: "Cardiología" }]}
      />
    );

    // Change role to ADMIN
    const roleSelect = screen.getByTestId("select-role");
    fireEvent.click(roleSelect);
    const adminOption = await screen.findByTestId("role-option-ADMIN");
    fireEvent.click(adminOption);

    // Submit — triggers confirmation dialog
    fireEvent.click(screen.getByTestId("btn-submit"));

    // Wait for confirm dialog
    await waitFor(() => {
      expect(screen.getByText(/confirmar cambio de rol/i)).toBeInTheDocument();
    });

    // Confirm the role change
    const confirmBtn = screen.getByRole("button", { name: /confirmar cambio/i });
    fireEvent.click(confirmBtn);

    // Backend rejects — should show roleUpdateError toast, NOT updateSuccess
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Error al actualizar el rol del usuario"
      );
    });
    expect(toast.success).not.toHaveBeenCalled();
    // MUST NOT navigate away — role change was NOT persisted
    expect(mockRouterPush).not.toHaveBeenCalledWith("/admin/doctors");
  });

  it("NO ejecuta PATCH al cancelar el ConfirmDialog", async () => {
    render(
      <EditDoctorPageContent
        doctorId="doctor-1"
        specialties={[{ id: "spec-1", name: "Cardiología" }]}
      />
    );

    // Change role
    const roleSelect = screen.getByTestId("select-role");
    fireEvent.click(roleSelect);
    const adminOption = await screen.findByTestId("role-option-ADMIN");
    fireEvent.click(adminOption);

    // Submit
    fireEvent.click(screen.getByTestId("btn-submit"));

    // Wait for confirm dialog
    await waitFor(() => {
      expect(screen.getByText(/confirmar cambio de rol/i)).toBeInTheDocument();
    });

    // Click cancel
    const cancelBtn = screen.getByRole("button", { name: /cancelar/i });
    fireEvent.click(cancelBtn);

    // Mutate should NOT have been called
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it(" restaura el rol original en el form cuando el backend rechaza el cambio", async () => {
    mockMutate.mockRejectedValue(new Error("422 Unprocessable Entity"));

    render(
      <EditDoctorPageContent
        doctorId="doctor-1"
        specialties={[{ id: "spec-1", name: "Cardiología" }]}
      />
    );

    // Verify initial role is DOCTOR
    const roleSelect = screen.getByTestId("select-role");
    expect(roleSelect).toHaveTextContent(/doctor/i);

    // Change role to ADMIN
    fireEvent.click(roleSelect);
    const adminOption = await screen.findByTestId("role-option-ADMIN");
    fireEvent.click(adminOption);

    // Submit — triggers confirmation dialog
    fireEvent.click(screen.getByTestId("btn-submit"));

    // Wait for confirm dialog
    await waitFor(() => {
      expect(screen.getByText(/confirmar cambio de rol/i)).toBeInTheDocument();
    });

    // Confirm the role change
    const confirmBtn = screen.getByRole("button", { name: /confirmar cambio/i });
    fireEvent.click(confirmBtn);

    // Wait for rejection
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Error al actualizar el rol del usuario"
      );
    });

    // Form should now show original role (DOCTOR), not the attempted new role
    expect(screen.getByTestId("select-role")).toHaveTextContent(/doctor/i);
  });
});
