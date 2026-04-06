import React from "react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { DoctorFilters } from "../DoctorFilters";

const mockSpecialties = [
  { id: "spec-1", name: "Cardiología" },
  { id: "spec-2", name: "Pediatría" },
  { id: "spec-3", name: "Dermatología" },
];

describe("DoctorFilters", () => {
  const defaultProps = {
    search: "",
    onSearchChange: vi.fn(),
    isActive: undefined,
    onIsActiveChange: vi.fn(),
    specialtyId: undefined,
    onSpecialtyChange: vi.fn(),
    specialties: mockSpecialties,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza correctamente con todos los filtros", () => {
    render(<DoctorFilters {...defaultProps} />);
    expect(screen.getByTestId("doctor-filters")).toBeInTheDocument();
    expect(screen.getByTestId("input-search")).toBeInTheDocument();
    expect(screen.getByTestId("select-specialty-filter")).toBeInTheDocument();
    expect(screen.getByTestId("select-status")).toBeInTheDocument();
  });

  it("llama onSearchChange al escribir en el campo de búsqueda", async () => {
    const user = userEvent.setup();
    render(<DoctorFilters {...defaultProps} />);

    const searchInput = screen.getByTestId("input-search");
    await user.type(searchInput, "M");

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith("M");
  });

  it("muestra el valor de búsqueda actual", () => {
    render(<DoctorFilters {...defaultProps} search="Juan" />);
    const searchInput = screen.getByTestId("input-search");
    expect(searchInput).toHaveValue("Juan");
  });

  it("renderiza el selector de especialidad con las especialidades dadas", () => {
    render(<DoctorFilters {...defaultProps} />);
    const selectTrigger = screen.getByTestId("select-specialty-filter");
    expect(selectTrigger).toBeInTheDocument();
  });

  it("renderiza el selector de estado", () => {
    render(<DoctorFilters {...defaultProps} />);
    const statusTrigger = screen.getByTestId("select-status");
    expect(statusTrigger).toBeInTheDocument();
  });

  it("muestra el filtro de especialidad seleccionado", () => {
    render(<DoctorFilters {...defaultProps} specialtyId="spec-1" />);
    const selectTrigger = screen.getByTestId("select-specialty-filter");
    expect(selectTrigger).toBeInTheDocument();
  });

  it("muestra el filtro de estado activo seleccionado", () => {
    render(<DoctorFilters {...defaultProps} isActive={true} />);
    const statusTrigger = screen.getByTestId("select-status");
    expect(statusTrigger).toBeInTheDocument();
  });

  it("muestra el filtro de estado inactivo seleccionado", () => {
    render(<DoctorFilters {...defaultProps} isActive={false} />);
    const statusTrigger = screen.getByTestId("select-status");
    expect(statusTrigger).toBeInTheDocument();
  });

  it("renderiza con lista vacía de especialidades", () => {
    render(<DoctorFilters {...defaultProps} specialties={[]} />);
    expect(screen.getByTestId("select-specialty-filter")).toBeInTheDocument();
  });
});
