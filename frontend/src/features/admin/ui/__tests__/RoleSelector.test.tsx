import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/__tests__/test-utils";
import { RoleSelector } from "../RoleSelector";
// Radix DOM polyfills are provided by global setup.ts

describe("RoleSelector — current value rendering", () => {
  it("muestra el rol actual como valor seleccionado cuando role es DOCTOR", () => {
    render(
      <RoleSelector
        value="DOCTOR"
        onChange={vi.fn()}
        disabled={false}
        isUnsupported={false}
      />
    );
    // The select trigger should display the current role label
    expect(screen.getByTestId("select-role")).toBeInTheDocument();
    expect(screen.getByText("Doctor")).toBeInTheDocument();
  });

  it("muestra el rol actual ADMIN cuando value es ADMIN", () => {
    render(
      <RoleSelector
        value="ADMIN"
        onChange={vi.fn()}
        disabled={false}
        isUnsupported={false}
      />
    );
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });
});

describe("RoleSelector — ADMIN/DOCTOR options available", () => {
  it("ofrece opciones ADMIN y DOCTOR en el menú", async () => {
    render(
      <RoleSelector
        value="DOCTOR"
        onChange={vi.fn()}
        disabled={false}
        isUnsupported={false}
      />
    );
    const trigger = screen.getByTestId("select-role");
    fireEvent.click(trigger);
    // Both options should be rendered in the portal list after open
    await waitFor(() => {
      expect(screen.getByTestId("role-option-DOCTOR")).toBeInTheDocument();
      expect(screen.getByTestId("role-option-ADMIN")).toBeInTheDocument();
    });
  });

  it("llama onChange con el nuevo rol al seleccionar ADMIN", async () => {
    const onChange = vi.fn();
    render(
      <RoleSelector
        value="DOCTOR"
        onChange={onChange}
        disabled={false}
        isUnsupported={false}
      />
    );
    const trigger = screen.getByTestId("select-role");
    fireEvent.click(trigger);
    const adminOption = await screen.findByTestId("role-option-ADMIN");
    fireEvent.click(adminOption);
    expect(onChange).toHaveBeenCalledWith("ADMIN");
  });
});

describe("RoleSelector — disabled/hidden fallback", () => {
  it("muestra mensaje de no soportado cuando isUnsupported=true", () => {
    render(
      <RoleSelector
        value={undefined}
        onChange={vi.fn()}
        disabled={true}
        isUnsupported={true}
      />
    );
    expect(
      screen.getByTestId("role-unsupported-message")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("role-unsupported-message").textContent
    ).not.toBe("");
  });

  it("deshabilita el selector cuando disabled=true pero isUnsupported=false", () => {
    render(
      <RoleSelector
        value="DOCTOR"
        onChange={vi.fn()}
        disabled={true}
        isUnsupported={false}
      />
    );
    const trigger = screen.getByTestId("select-role");
    expect(trigger).toHaveAttribute("disabled");
  });
});

describe("RoleSelector — helper copy", () => {
  it("muestra texto de ayuda cuando el selector está activo", () => {
    render(
      <RoleSelector
        value="DOCTOR"
        onChange={vi.fn()}
        disabled={false}
        isUnsupported={false}
        helperText="Selecciona el rol del usuario"
      />
    );
    expect(screen.getByText("Selecciona el rol del usuario")).toBeInTheDocument();
  });
});
