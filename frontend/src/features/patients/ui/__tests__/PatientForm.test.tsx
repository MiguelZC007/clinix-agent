import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { MOCK_PATIENTS } from "../../__mocks__/patients.mock";
import { PatientForm } from "../PatientForm";

describe("PatientForm", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza formulario vacio para nuevo paciente", () => {
    render(<PatientForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
    expect(screen.getByLabelText("Apellido")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo")).toBeInTheDocument();
  });

  it("prellena formulario con datos del paciente", () => {
    const patient = MOCK_PATIENTS[0];
    render(
      <PatientForm
        patient={patient}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    const nameInput = screen.getByLabelText("Nombre") as HTMLInputElement;
    expect(nameInput.value).toBe(patient.name);
  });

  it("muestra errores de validacion", async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole("button", { name: /guardar/i });
    await user.click(submitButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("llama onSubmit con datos validos", async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await user.type(screen.getByLabelText("Nombre"), "Juan");
    await user.type(screen.getByLabelText("Apellido"), "Pérez");
    await user.type(screen.getByLabelText("Fecha de Nacimiento"), "1990-05-15");
    await user.type(screen.getByLabelText("Teléfono"), "+591 70000001");
    await user.type(screen.getByLabelText("Correo"), "juan@example.com");
    await user.type(screen.getByLabelText("Dirección"), "Av. Principal 123");

    const submitButton = screen.getByRole("button", { name: /guardar/i });
    await user.click(submitButton);

    await vi.waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it("llama onCancel al hacer click en cancelar", async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("muestra loading state", () => {
    render(
      <PatientForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />,
    );

    const submitButton = screen.getByRole("button", { name: /guardar/i });
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    expect(submitButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });
});
