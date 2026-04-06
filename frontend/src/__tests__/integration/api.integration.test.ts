import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAppointmentsByPatient,
} from "@/features/appointments/api/appointments.api";
import type { CreateAppointmentRequest } from "@/features/appointments/types/appointment.types";
import { login, logout } from "@/features/auth/api/auth.api";
import {
  getClinicalHistories,
  getClinicalHistoryById,
  createClinicalHistory,
  getClinicalHistoriesByPatient,
} from "@/features/clinical-histories/api/clinical-histories.api";
import type { CreateClinicHistoryBackendPayload } from "@/features/clinical-histories/types/create-clinical-history-backend.types";
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from "@/features/messages/api/messages.api";
import type { SendMessageRequest } from "@/features/messages/types/message.types";
import {
  getPatients,
  createPatient,
  updatePatient,
  getPatientById,
  getPatientAntecedents,
  updatePatientAntecedents,
  deletePatient,
} from "@/features/patients/api/patients.api";
import type { CreatePatientRequest } from "@/features/patients/types/patient.types";
import {
  sendWhatsAppMessage,
  getMessageStatus,
} from "@/features/twilio/api/whatsapp.api";
import { api } from "@/lib/api/axios";
import { server } from "../mocks/server";

vi.mock("@/lib/api/axios", async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...(original as object),
    getAuthToken: async () => process.env.TEST_ACCESS_TOKEN ?? null,
  };
});

describe.sequential("E2E integración frontend-backend", () => {
  const baseUrl = process.env.NEXT_API_URL ?? "http://localhost:4000/v1";
  const testPhone = process.env.TEST_PHONE;
  const testPassword = process.env.TEST_PASSWORD;
  let token: string = process.env.TEST_ACCESS_TOKEN ?? "";
  const tokenWasProvided = Boolean(token);

  if (!token && (!testPhone || !testPassword)) {
    throw new Error(
      "Para ejecutar estos tests: backend en puerto 4000 (o NEXT_API_URL), BD con seed ejecutado. Define TEST_PHONE y TEST_PASSWORD en .env.local o en el entorno.",
    );
  }

  let lastAuthHeader: string | undefined;
  let interceptorId: number | undefined;
  let patientId: string | undefined;
  let clinicalHistoryId: string | undefined;
  let appointmentId: string | undefined;
  let conversationId: string | undefined;
  let whatsappMessageSid: string | undefined;

  const expectAuthHeader = (currentToken: string) => {
    expect(lastAuthHeader).toBe(`Bearer ${currentToken}`);
  };

  const buildPatientPayload = (): CreatePatientRequest => ({
    name: "Paciente",
    lastName: "Prueba",
    birthDate: "1990-01-01",
    gender: "male",
    phone: "+591300000000",
    email: `paciente-${Date.now()}@example.com`,
    address: "Dirección de prueba",
  });

  const buildClinicalHistoryPayloadBackend = (
    appointmentId: string,
  ): CreateClinicHistoryBackendPayload => ({
    appointmentId,
    consultationReason: "Control de prueba con al menos diez caracteres",
    symptoms: ["Síntoma de prueba"],
    treatment: "Tratamiento de prueba con al menos diez caracteres",
    diagnostics: [
      { name: "Diagnóstico", description: "Descripción del diagnóstico" },
    ],
    physicalExams: [
      { name: "Examen físico", description: "Descripción del examen" },
    ],
    vitalSigns: [
      {
        name: "Presión arterial",
        value: "120/80",
        unit: "mmHg",
        measurement: "sistólica/diastólica",
      },
    ],
  });

  const buildAppointmentPayloadBackend = (
    patientId: string,
    specialtyId: string,
  ): CreateAppointmentRequest => {
    const date = new Date().toISOString().slice(0, 10);
    const start = new Date(`${date}T10:00:00.000Z`);
    const end = new Date(`${date}T10:30:00.000Z`);
    return {
      patientId,
      specialtyId,
      startAppointment: start.toISOString(),
      endAppointment: end.toISOString(),
      reason: "Cita de prueba",
    };
  };

  const captureAuthHeader = () => {
    interceptorId = api.interceptors.request.use((config) => {
      const header =
        (config.headers?.Authorization as string | undefined) ??
        (config.headers as Record<string, unknown> | undefined)?.authorization;
      lastAuthHeader = typeof header === "string" ? header : undefined;
      return config;
    });
  };

  beforeAll(() => {
    server.close();
    api.defaults.baseURL = baseUrl;
    captureAuthHeader();
  });

  afterAll(async () => {
    if (interceptorId !== undefined) {
      api.interceptors.request.eject(interceptorId);
    }
    if (token && !tokenWasProvided) {
      try {
        await logout();
      } catch {
        // Ignorar errores de cierre de sesión para no enmascarar resultados previos
      }
    }
  });

  it("smoke: backend accesible y login devuelve contrato ApiResponse", async () => {
    if (token) {
      expect(token.length).toBeGreaterThan(10);
      return;
    }
    const response = await login({
      phone: testPhone as string,
      password: testPassword as string,
    });
    expect(response).toBeDefined();
    expect(typeof response.accessToken).toBe("string");
    expect(response.accessToken.length).toBeGreaterThan(10);
    expect(response.user).toBeDefined();
    expect(typeof response.user.id).toBe("string");
    expect(typeof response.user.phone).toBe("string");
    token = response.accessToken;
    process.env.TEST_ACCESS_TOKEN = token;
  });

  it("pacientes: lista y CRUD básico con token", async () => {
    const patients = await getPatients();
    expectAuthHeader(token);

    patientId = patients.items[0]?.id;

    if (!patientId) {
      const created = await createPatient(buildPatientPayload());
      expectAuthHeader(token);
      patientId = created.id;
    }

    const fetched = await getPatientById(patientId as string);
    expectAuthHeader(token);
    expect(fetched.id).toBe(patientId);

    const updated = await updatePatient(patientId as string, {
      address: "Dirección actualizada",
    });
    expectAuthHeader(token);
    expect(updated.address).toBeDefined();

    const antecedents = await getPatientAntecedents(patientId as string);
    expectAuthHeader(token);
    await updatePatientAntecedents(patientId as string, {
      allergies: [...(antecedents.allergies ?? []), "Polen"],
    });
    expectAuthHeader(token);
  }, 30000);

  it("pacientes: deletePatient devuelve contrato { deleted: true, id }", async () => {
    const created = await createPatient(buildPatientPayload());
    expectAuthHeader(token);
    expect(created.id).toBeDefined();

    const fetched = await getPatientById(created.id);
    expectAuthHeader(token);
    expect(fetched.id).toBe(created.id);

    const result = await deletePatient(created.id);
    expectAuthHeader(token);
    expect(result).toEqual({ deleted: true, id: created.id });
  }, 30000);

  it("citas: crea, actualiza, cancela y consulta", async () => {
    const list = await getAppointments();
    expectAuthHeader(token);
    const first = list.items[0];
    if (!first?.specialtyId) {
      throw new Error(
        "getAppointments debe devolver al menos una cita con specialtyId (ejecuta seed).",
      );
    }
    const created = await createAppointment(
      buildAppointmentPayloadBackend(patientId as string, first.specialtyId),
    );
    expectAuthHeader(token);
    appointmentId = created.id;

    const updated = await updateAppointment(appointmentId as string, {
      reason: "Cita actualizada",
    });
    expectAuthHeader(token);
    expect(updated.reason).toBeDefined();

    const fetched = await getAppointmentById(appointmentId as string);
    expectAuthHeader(token);
    expect(fetched.id).toBe(appointmentId);

    const byPatient = await getAppointmentsByPatient(patientId as string);
    expectAuthHeader(token);
    expect(Array.isArray(byPatient)).toBe(true);

    const cancelled = await cancelAppointment(appointmentId as string);
    expectAuthHeader(token);
    expect(cancelled.status).toBeDefined();

    const listAfter = await getAppointments();
    expectAuthHeader(token);
    expect(listAfter.items.length).toBeGreaterThan(0);
  }, 30000);

  it("historias clínicas: crea y consulta", async () => {
    if (!appointmentId) {
      throw new Error("Se requiere appointmentId del test de citas.");
    }
    const payload = buildClinicalHistoryPayloadBackend(appointmentId);
    const history = await createClinicalHistory(payload);
    expectAuthHeader(token);
    clinicalHistoryId = history.id;

    const fetched = await getClinicalHistoryById(clinicalHistoryId);
    expectAuthHeader(token);
    expect(fetched.id).toBe(clinicalHistoryId);

    const listByPatient = await getClinicalHistoriesByPatient(
      patientId as string,
    );
    expectAuthHeader(token);
    expect(Array.isArray(listByPatient)).toBe(true);

    const list = await getClinicalHistories({ page: 1, pageSize: 10 });
    expectAuthHeader(token);
    expect(list.items.length).toBeGreaterThan(0);
    expect(list.page).toBe(1);
    expect(list.pageSize).toBe(10);
    expect(typeof list.total).toBe("number");
    expect(typeof list.totalPages).toBe("number");
  }, 30000);

  it("mensajes: conversaciones, mensajes y lectura", async () => {
    const conversations = await getConversations();
    expectAuthHeader(token);
    conversationId = conversations.items[0]?.id;

    if (!conversationId) {
      console.warn(
        "No hay conversaciones disponibles; se omiten pruebas de mensajes",
      );
      return;
    }

    const messages = await getMessages(conversationId);
    expectAuthHeader(token);
    if (messages.items.length > 0) {
      await markAsRead(conversationId);
      expectAuthHeader(token);
    }

    const sendPayload: SendMessageRequest = {
      conversationId,
      content: "Mensaje de prueba",
    };
    const sent = await sendMessage(sendPayload);
    expectAuthHeader(token);
    expect(sent.conversationId).toBe(conversationId);
  });

  it("twilio: envío y consulta de estado (condicional)", async () => {
    const to = process.env.TEST_TWILIO_TO;
    const body = process.env.TEST_TWILIO_BODY ?? "Mensaje de prueba";

    if (!to) {
      console.warn(
        "TEST_TWILIO_TO no está definido; se omiten pruebas de Twilio",
      );
      return;
    }

    const sent = await sendWhatsAppMessage({ to, body });
    expectAuthHeader(token);
    whatsappMessageSid = sent.messageSid;

    const status = await getMessageStatus(whatsappMessageSid);
    expectAuthHeader(token);
    expect(status.sid).toBe(whatsappMessageSid);
  });

  it("logout invalida sesión", async () => {
    if (tokenWasProvided) {
      console.warn(
        "TEST_ACCESS_TOKEN fue provisto; se omite logout para no revocar el token",
      );
      return;
    }
    try {
      await logout();
    } catch {}
    expectAuthHeader(token);
    token = "";
    process.env.TEST_ACCESS_TOKEN = "";
  });
});
