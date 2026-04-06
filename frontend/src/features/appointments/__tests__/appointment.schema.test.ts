import { describe, it, expect } from "vitest";
import {
  appointmentFormSchema,
  appointmentStatusSchema,
} from "../schemas/appointment.schema";
import { mapAppointmentFromBackend } from "../utils/appointment.mapper";
import type { AppointmentBackend } from "../types/appointment.types";

describe("appointmentStatusSchema", () => {
  it("valida estados validos", () => {
    expect(appointmentStatusSchema.parse("scheduled")).toBe("scheduled");
    expect(appointmentStatusSchema.parse("completed")).toBe("completed");
    expect(appointmentStatusSchema.parse("cancelled")).toBe("cancelled");
    expect(appointmentStatusSchema.parse("pending")).toBe("pending");
  });

  it("rechaza estados invalidos", () => {
    expect(() => appointmentStatusSchema.parse("invalid")).toThrow();
    expect(() => appointmentStatusSchema.parse("")).toThrow();
  });
});

describe("mapAppointmentFromBackend", () => {
  const validAppointmentBackend: AppointmentBackend = {
    id: "1",
    patientId: "patient-1",
    startAppointment: "2024-01-15T09:00:00.000Z",
    endAppointment: "2024-01-15T09:30:00.000Z",
    reason: "Control rutinario",
    status: "SCHEDULED",
    patient: {
      id: "patient-1",
      name: "Juan",
      lastName: "Pérez",
    },
  };

  it("mapea cita completa correctamente", () => {
    const result = mapAppointmentFromBackend(validAppointmentBackend);
    expect(result.id).toBe("1");
    expect(result.patientName).toBe("Juan Pérez");
    expect(result.patientInitials).toBe("JP");
  });

  it("convierte startAppointment/endAppointment a date/startTime/endTime", () => {
    const result = mapAppointmentFromBackend(validAppointmentBackend);
    expect(result.date).toBeInstanceOf(Date);
    const startDate = new Date(validAppointmentBackend.startAppointment);
    const endDate = new Date(validAppointmentBackend.endAppointment);
    const expectedStartTime = `${startDate.getHours().toString().padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}`;
    const expectedEndTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;
    expect(result.startTime).toBe(expectedStartTime);
    expect(result.endTime).toBe(expectedEndTime);
  });

  it("mapea status PENDING a pending", () => {
    const result = mapAppointmentFromBackend({
      ...validAppointmentBackend,
      status: "PENDING",
    });
    expect(result.status).toBe("pending");
  });

  it("mapea status SCHEDULED a scheduled", () => {
    const result = mapAppointmentFromBackend({
      ...validAppointmentBackend,
      status: "SCHEDULED",
    });
    expect(result.status).toBe("scheduled");
  });
});

describe("appointmentFormSchema", () => {
  const validFormData = {
    patientId: "1",
    specialtyId: "1",
    date: "2024-01-15",
    startTime: "09:00",
    endTime: "09:30",
    reason: "Control rutinario",
  };

  it("valida formulario completo correctamente", () => {
    expect(appointmentFormSchema.parse(validFormData)).toEqual(validFormData);
  });

  it("rechaza patientId vacio", () => {
    expect(() =>
      appointmentFormSchema.parse({ ...validFormData, patientId: "" }),
    ).toThrow();
  });

  it("rechaza date vacio", () => {
    expect(() =>
      appointmentFormSchema.parse({ ...validFormData, date: "" }),
    ).toThrow();
  });

  it("rechaza reason vacio", () => {
    expect(() =>
      appointmentFormSchema.parse({ ...validFormData, reason: "" }),
    ).toThrow();
  });

  it("rechaza campos faltantes", () => {
    expect(() => appointmentFormSchema.parse({})).toThrow();
  });

  it("rechaza endTime anterior a startTime", () => {
    expect(() =>
      appointmentFormSchema.parse({
        ...validFormData,
        startTime: "10:00",
        endTime: "09:00",
      }),
    ).toThrow();
  });

  it("rechaza endTime igual a startTime", () => {
    expect(() =>
      appointmentFormSchema.parse({
        ...validFormData,
        startTime: "10:00",
        endTime: "10:00",
      }),
    ).toThrow();
  });

  it("acepta endTime posterior a startTime", () => {
    expect(
      appointmentFormSchema.parse({
        ...validFormData,
        startTime: "09:00",
        endTime: "10:00",
      }),
    ).toEqual({ ...validFormData, startTime: "09:00", endTime: "10:00" });
  });
});
