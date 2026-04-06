import { describe, it, expect } from "vitest";
import {
  vitalSignsSchema,
  clinicalHistorySchema,
  vitalSignsFormSchema,
  clinicalHistoryFormSchema,
  clinicalHistoriesListResponseSchema,
  clinicalHistoryBackendSchema,
} from "../schemas/clinical-history.schema";

describe("vitalSignsSchema", () => {
  const validVitalSigns = {
    bloodPressure: "120/80",
    heartRate: 72,
    temperature: 36.5,
    weight: 75,
    height: 175,
  };

  it("valida signos vitales correctamente", () => {
    expect(vitalSignsSchema.parse(validVitalSigns)).toEqual(validVitalSigns);
  });

  it("rechaza tipos incorrectos", () => {
    expect(() =>
      vitalSignsSchema.parse({ ...validVitalSigns, heartRate: "invalid" }),
    ).toThrow();
  });
});

describe("clinicalHistorySchema", () => {
  const validHistory = {
    id: "1",
    patientId: "1",
    patientName: "Juan Pérez",
    reason: "Dolor abdominal",
    symptoms: "Dolor en zona epigástrica",
    physicalExam: "Abdomen blando",
    diagnosis: "Gastritis aguda",
    treatment: "Omeprazol 20mg",
    notes: "Control en 2 semanas",
    vitalSigns: {
      bloodPressure: "120/80",
      heartRate: 72,
      temperature: 36.5,
      weight: 75,
      height: 175,
    },
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z",
  };

  it("valida historial completo correctamente", () => {
    expect(clinicalHistorySchema.parse(validHistory)).toEqual(validHistory);
  });

  it("acepta patientName opcional", () => {
    const { patientName: _patientName, ...historyWithoutName } = validHistory;
    expect(clinicalHistorySchema.parse(historyWithoutName)).not.toHaveProperty(
      "patientName",
    );
  });

  it("rechaza historial sin campos requeridos", () => {
    expect(() => clinicalHistorySchema.parse({})).toThrow();
  });
});

describe("vitalSignsFormSchema", () => {
  const validFormData = {
    bloodPressure: "120/80",
    heartRate: 72,
    temperature: 36.5,
    weight: 75,
    height: 175,
  };

  it("valida formulario de signos vitales correctamente", () => {
    expect(vitalSignsFormSchema.parse(validFormData)).toEqual(validFormData);
  });

  it("rechaza valores menores al minimo", () => {
    expect(() =>
      vitalSignsFormSchema.parse({ ...validFormData, heartRate: 0 }),
    ).toThrow();
    expect(() =>
      vitalSignsFormSchema.parse({ ...validFormData, temperature: 0 }),
    ).toThrow();
    expect(() =>
      vitalSignsFormSchema.parse({ ...validFormData, weight: 0 }),
    ).toThrow();
    expect(() =>
      vitalSignsFormSchema.parse({ ...validFormData, height: 0 }),
    ).toThrow();
  });

  it("rechaza campos vacios", () => {
    expect(() =>
      vitalSignsFormSchema.parse({ ...validFormData, bloodPressure: "" }),
    ).toThrow();
  });
});

describe("clinicalHistoryFormSchema", () => {
  const validFormData = {
    patientId: "1",
    appointmentId: "apt-1",
    reason: "Dolor abdominal",
    symptoms: "Dolor en zona epigástrica",
    physicalExam: "Abdomen blando",
    diagnosis: "Gastritis aguda",
    treatment: "Omeprazol 20mg",
    vitalSigns: {
      bloodPressure: "120/80",
      heartRate: 72,
      temperature: 36.5,
      weight: 75,
      height: 175,
    },
  };

  it("valida formulario completo correctamente", () => {
    expect(clinicalHistoryFormSchema.parse(validFormData)).toEqual(
      validFormData,
    );
  });

  it("rechaza campos requeridos faltantes", () => {
    expect(() => clinicalHistoryFormSchema.parse({})).toThrow();
    expect(() => clinicalHistoryFormSchema.parse({ patientId: "1" })).toThrow();
  });
});

describe("clinicalHistoriesListResponseSchema", () => {
  const validResponse = {
    items: [
      {
        id: "1",
        patientId: "1",
        reason: "Dolor abdominal",
        symptoms: "Dolor en zona epigástrica",
        physicalExam: "Abdomen blando",
        diagnosis: "Gastritis aguda",
        treatment: "Omeprazol 20mg",
        notes: "Control en 2 semanas",
        vitalSigns: {
          bloodPressure: "120/80",
          heartRate: 72,
          temperature: 36.5,
          weight: 75,
          height: 175,
        },
        createdAt: "2024-01-20T10:00:00Z",
        updatedAt: "2024-01-20T10:00:00Z",
      },
    ],
    total: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  };

  it("valida respuesta de lista correctamente", () => {
    expect(clinicalHistoriesListResponseSchema.parse(validResponse)).toEqual(
      validResponse,
    );
  });

  it("valida contrato paginado con items, total, page, pageSize, totalPages", () => {
    const parsed = clinicalHistoriesListResponseSchema.parse(validResponse);
    expect(parsed).toHaveProperty("items");
    expect(parsed).toHaveProperty("total", 1);
    expect(parsed).toHaveProperty("page", 1);
    expect(parsed).toHaveProperty("pageSize", 10);
    expect(parsed).toHaveProperty("totalPages", 1);
    expect(Array.isArray(parsed.items)).toBe(true);
  });
});

describe("clinicalHistoryBackendSchema", () => {
  const validBackendItem = {
    id: "ch-1",
    patientId: "p-1",
    appointmentId: null as string | null,
    consultationReason: "Control",
    symptoms: [] as string[],
    treatment: "Ninguno",
    diagnostics: [{ name: "Ninguno", description: "" }],
    physicalExams: [{ name: "General", description: "Normal" }],
    vitalSigns: [
      { name: "TA", value: "120/80", unit: "mmHg", measurement: "manual" },
    ],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  it("acepta appointmentId null", () => {
    const parsed = clinicalHistoryBackendSchema.parse(validBackendItem);
    expect(parsed.appointmentId).toBeNull();
  });

  it("acepta appointmentId string", () => {
    const withAppointment = { ...validBackendItem, appointmentId: "apt-1" };
    const parsed = clinicalHistoryBackendSchema.parse(withAppointment);
    expect(parsed.appointmentId).toBe("apt-1");
  });
});
