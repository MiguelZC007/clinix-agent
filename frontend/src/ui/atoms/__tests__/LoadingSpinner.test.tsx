import { describe, it, expect } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { LoadingSpinner } from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renderiza correctamente", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole("status", { name: "Loading" });
    expect(spinner).toBeInTheDocument();
  });

  it("aplica tamaño pequeño", () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByRole("status", { hidden: true });
    expect(spinner).toHaveClass("h-4");
    expect(spinner).toHaveClass("w-4");
  });

  it("aplica tamaño mediano", () => {
    render(<LoadingSpinner size="md" />);
    const spinner = screen.getByRole("status", { hidden: true });
    expect(spinner).toHaveClass("h-6");
    expect(spinner).toHaveClass("w-6");
  });

  it("aplica tamaño grande", () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole("status", { hidden: true });
    expect(spinner).toHaveClass("h-10");
    expect(spinner).toHaveClass("w-10");
  });

  it("aplica className personalizada", () => {
    render(<LoadingSpinner className="custom-class" />);
    const spinner = screen.getByRole("status", { hidden: true });
    expect(spinner).toHaveClass("custom-class");
  });

  it("permite personalizar el nombre accesible", () => {
    render(<LoadingSpinner label="Guardando" />);
    expect(
      screen.getByRole("status", { name: "Guardando" }),
    ).toBeInTheDocument();
  });
});
