import { describe, it, expect } from "vitest";
import {
  patientSchema,
  patientFormSchema,
  genderSchema,
  patientsListResponseSchema,
} from "../schemas/patient.schema";

describe("genderSchema", () => {
  it("valida generos validos", () => {
    expect(genderSchema.parse("male")).toBe("male");
    expect(genderSchema.parse("female")).toBe("female");
  });

  it("valida other como genero valido", () => {
    expect(genderSchema.parse("other")).toBe("other");
  });

  it("rechaza generos invalidos", () => {
    expect(() => genderSchema.parse("invalid")).toThrow();
    expect(() => genderSchema.parse("")).toThrow();
    expect(() => genderSchema.parse(null)).toThrow();
  });
});

describe("patientSchema", () => {
  const validPatient = {
    id: "1",
    email: "juan@example.com",
    name: "Juan",
    lastName: "Pérez",
    phone: "+591 70000001",
    address: "Av. Principal 123",
    birthDate: "1990-05-15",
    gender: "male" as const,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  };

  it("valida paciente completo correctamente", () => {
    expect(patientSchema.parse(validPatient)).toEqual(validPatient);
  });

  it("rechaza email invalido", () => {
    expect(() =>
      patientSchema.parse({ ...validPatient, email: "invalid-email" }),
    ).toThrow();
  });

  it("rechaza paciente sin campos requeridos", () => {
    expect(() => patientSchema.parse({})).toThrow();
    expect(() => patientSchema.parse({ id: "1" })).toThrow();
  });
});

describe("patientFormSchema", () => {
  const validFormData = {
    name: "Juan",
    lastName: "Pérez",
    birthDate: "1990-05-15",
    gender: "male" as const,
    phone: "+591 70000001",
    email: "juan@example.com",
    address: "Av. Principal 123",
  };

  it("valida formulario completo correctamente", () => {
    expect(patientFormSchema.parse(validFormData)).toEqual(validFormData);
  });

  it("rechaza name vacio", () => {
    expect(() =>
      patientFormSchema.parse({ ...validFormData, name: "" }),
    ).toThrow();
  });

  it("acepta name de un solo caracter", () => {
    expect(() =>
      patientFormSchema.parse({ ...validFormData, name: "A" }),
    ).not.toThrow();
  });

  it("rechaza email invalido", () => {
    expect(() =>
      patientFormSchema.parse({ ...validFormData, email: "invalid" }),
    ).toThrow();
  });

  it("rechaza campos requeridos faltantes", () => {
    expect(() => patientFormSchema.parse({})).toThrow();
    expect(() => patientFormSchema.parse({ name: "Juan" })).toThrow();
  });

  it("acepta address vacio u omitido", () => {
    const withoutAddress = { ...validFormData, address: undefined };
    const result = patientFormSchema.parse(withoutAddress);
    expect(result.address).toBeUndefined();
  });
});

describe("patientsListResponseSchema", () => {
  const validResponse = {
    items: [
      {
        id: "1",
        email: "juan@example.com",
        name: "Juan",
        lastName: "Pérez",
        phone: "+591 70000001",
        address: "Av. Principal 123",
        birthDate: "1990-05-15",
        gender: "male" as const,
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z",
      },
    ],
    total: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  };

  it("valida respuesta de lista correctamente", () => {
    expect(patientsListResponseSchema.parse(validResponse)).toEqual(
      validResponse,
    );
  });

  it("rechaza respuesta sin items", () => {
    expect(() =>
      patientsListResponseSchema.parse({
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      }),
    ).toThrow();
  });

  it("rechaza respuesta con tipos incorrectos", () => {
    expect(() =>
      patientsListResponseSchema.parse({
        ...validResponse,
        total: "invalid",
      }),
    ).toThrow();
  });
});
