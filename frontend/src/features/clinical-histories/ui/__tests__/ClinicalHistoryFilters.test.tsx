import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { ClinicalHistoryFilters } from "../ClinicalHistoryFilters";

describe("ClinicalHistoryFilters", () => {
  const defaultProps = {
    search: "",
    onSearchChange: vi.fn(),
    dateFrom: "",
    dateTo: "",
    onDateFromChange: vi.fn(),
    onDateToChange: vi.fn(),
  };

  it("renderiza con valores vacíos", () => {
    render(<ClinicalHistoryFilters {...defaultProps} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(
      document.getElementById("clinical-history-date-from"),
    ).toBeInTheDocument();
    expect(
      document.getElementById("clinical-history-date-to"),
    ).toBeInTheDocument();
  });

  it("muestra placeholder de búsqueda", () => {
    render(<ClinicalHistoryFilters {...defaultProps} />);
    expect(
      screen.getByPlaceholderText(
        "Buscar por paciente, diagnóstico, motivo...",
      ),
    ).toBeInTheDocument();
  });

  it("llama onSearchChange al cambiar búsqueda", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(
      <ClinicalHistoryFilters
        {...defaultProps}
        onSearchChange={onSearchChange}
      />,
    );
    const input = screen.getByRole("textbox");
    await user.type(input, "dolor");
    expect(onSearchChange).toHaveBeenCalled();
  });

  it("llama onDateFromChange al cambiar fecha desde", async () => {
    const user = userEvent.setup();
    const onDateFromChange = vi.fn();
    render(
      <ClinicalHistoryFilters
        {...defaultProps}
        onDateFromChange={onDateFromChange}
      />,
    );
    const input = document.getElementById("clinical-history-date-from");
    expect(input).toBeInTheDocument();
    if (input) {
      await user.type(input, "2026-01-01");
      expect(onDateFromChange).toHaveBeenCalled();
    }
  });

  it("llama onDateToChange al cambiar fecha hasta", async () => {
    const user = userEvent.setup();
    const onDateToChange = vi.fn();
    render(
      <ClinicalHistoryFilters
        {...defaultProps}
        onDateToChange={onDateToChange}
      />,
    );
    const input = document.getElementById("clinical-history-date-to");
    expect(input).toBeInTheDocument();
    if (input) {
      await user.type(input, "2026-12-31");
      expect(onDateToChange).toHaveBeenCalled();
    }
  });

  it("no muestra botón Limpiar cuando no hay filtros", () => {
    render(<ClinicalHistoryFilters {...defaultProps} />);
    expect(
      screen.queryByTestId("clinical-history-filters-clear"),
    ).not.toBeInTheDocument();
  });

  it("muestra botón Limpiar cuando hay search", () => {
    render(
      <ClinicalHistoryFilters
        {...defaultProps}
        search="test"
        onClear={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId("clinical-history-filters-clear"),
    ).toBeInTheDocument();
  });

  it("muestra botón Limpiar cuando hay dateFrom", () => {
    render(
      <ClinicalHistoryFilters
        {...defaultProps}
        dateFrom="2026-01-01"
        onClear={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId("clinical-history-filters-clear"),
    ).toBeInTheDocument();
  });

  it("llama onClear al hacer click en Limpiar filtros", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <ClinicalHistoryFilters
        {...defaultProps}
        search="test"
        onClear={onClear}
      />,
    );
    const button = screen.getByTestId("clinical-history-filters-clear");
    await user.click(button);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
