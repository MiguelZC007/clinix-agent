import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { MOCK_PATIENTS } from "../../__mocks__/patients.mock";
import { PatientTabs } from "../PatientTabs";

describe("PatientTabs", () => {
  it("renderiza correctamente", () => {
    render(<PatientTabs patient={MOCK_PATIENTS[0]} />);
    expect(screen.getByText("Juan")).toBeInTheDocument();
  });

  it("muestra tab de informacion por defecto", () => {
    render(<PatientTabs patient={MOCK_PATIENTS[0]} />);
    expect(screen.getByText("Juan")).toBeInTheDocument();
  });

  it("cambia de tab al hacer click", async () => {
    const user = userEvent.setup();
    render(<PatientTabs patient={MOCK_PATIENTS[0]} />);

    const antecedentsTab = screen.getByRole("tab", { name: /antecedentes/i });
    await user.click(antecedentsTab);

    expect(antecedentsTab).toHaveAttribute("aria-selected", "true");
  });
});
