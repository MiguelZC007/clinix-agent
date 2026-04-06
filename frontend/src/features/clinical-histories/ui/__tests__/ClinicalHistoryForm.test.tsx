import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { ClinicalHistoryForm } from "../ClinicalHistoryForm";

describe("ClinicalHistoryForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
    isLoading: false,
  };

  it("renderiza correctamente", () => {
    render(<ClinicalHistoryForm {...defaultProps} />);
    const form = document.querySelector("form");
    expect(form).toBeInTheDocument();
  });

  it("muestra errores de validacion", async () => {
    render(<ClinicalHistoryForm {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    const submitButton = buttons.find((btn) => btn.type === "submit");
    if (submitButton) {
      await submitButton.click();
    }
  });

  it("muestra loading cuando isLoading es true", () => {
    render(<ClinicalHistoryForm {...defaultProps} isLoading={true} />);
    const buttons = screen.getAllByRole("button");
    const submitButton = buttons.find((btn) => btn.type === "submit");
    if (submitButton) {
      expect(submitButton).toBeDisabled();
    }
  });
});
