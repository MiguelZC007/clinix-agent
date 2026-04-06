import { http, HttpResponse } from "msw";
import { MOCK_APPOINTMENTS } from "@/features/appointments/__mocks__/appointments.mock";
import type { Appointment } from "@/features/appointments/types/appointment.types";
import { MOCK_CLINICAL_HISTORIES } from "@/features/clinical-histories/__mocks__/clinical-histories.mock";
import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
} from "@/features/messages/__mocks__/messages.mock";
import { MOCK_PATIENTS } from "@/features/patients/__mocks__/patients.mock";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1";

function toBackendClinicalHistory(h: {
  id: string;
  patientId: string;
  patientName?: string;
  reason: string;
  symptoms: string;
  physicalExam: string;
  diagnosis: string;
  treatment: string;
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    weight: number;
    height: number;
  };
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: h.id,
    patientId: h.patientId,
    appointmentId: `apt-${h.id}`,
    consultationReason: h.reason,
    symptoms: h.symptoms.split(",").map((s) => s.trim()) || [h.symptoms],
    treatment: h.treatment,
    diagnostics: [{ name: h.diagnosis, description: "" }],
    physicalExams: [{ name: "Examen", description: h.physicalExam }],
    vitalSigns: [
      {
        name: "Presión arterial",
        value: h.vitalSigns.bloodPressure,
        unit: "mmHg",
        measurement: "",
        description: "",
      },
      {
        name: "Frecuencia cardíaca",
        value: String(h.vitalSigns.heartRate),
        unit: "lpm",
        measurement: "",
        description: "",
      },
      {
        name: "Temperatura",
        value: String(h.vitalSigns.temperature),
        unit: "°C",
        measurement: "",
        description: "",
      },
      {
        name: "Peso",
        value: String(h.vitalSigns.weight),
        unit: "kg",
        measurement: "",
        description: "",
      },
      {
        name: "Talla",
        value: String(h.vitalSigns.height),
        unit: "cm",
        measurement: "",
        description: "",
      },
    ],
    patient: h.patientName
      ? {
          id: h.patientId,
          name: h.patientName.split(" ")[0] ?? "",
          lastName: h.patientName.split(" ").slice(1).join(" ") ?? "",
        }
      : undefined,
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
  };
}

function convertAppointmentToBackendFormat(appointment: Appointment) {
  const [startHours, startMinutes] = appointment.startTime
    .split(":")
    .map(Number);
  const [endHours, endMinutes] = appointment.endTime.split(":").map(Number);

  const startAppointment = new Date(appointment.date);
  startAppointment.setHours(startHours, startMinutes, 0, 0);

  const endAppointment = new Date(appointment.date);
  endAppointment.setHours(endHours, endMinutes, 0, 0);

  const [firstName, ...lastNameParts] = appointment.patientName.split(" ");
  const lastName = lastNameParts.join(" ");

  const statusMap: Record<string, string> = {
    scheduled: "SCHEDULED",
    completed: "COMPLETED",
    cancelled: "CANCELLED",
    pending: "PENDING",
  };

  const patientId = appointment.patientId || `patient-${appointment.id}`;

  return {
    id: appointment.id,
    patientId: patientId,
    doctorId: appointment.doctorId,
    specialtyId: appointment.specialtyId,
    startAppointment: startAppointment.toISOString(),
    endAppointment: endAppointment.toISOString(),
    reason: appointment.reason,
    status: statusMap[appointment.status] || "PENDING",
    patient: {
      id: patientId,
      name: firstName,
      lastName: lastName,
    },
    doctor: appointment.doctor,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  };
}

export const handlers = [
  http.get(`${API_BASE_URL}/patients`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: MOCK_PATIENTS,
        total: MOCK_PATIENTS.length,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE_URL}/patients/:id`, ({ params }) => {
    const patient = MOCK_PATIENTS.find((p) => p.id === params.id);
    if (!patient) {
      return HttpResponse.json(
        {
          success: false,
          message: "Patient not found",
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      success: true,
      data: patient,
      timestamp: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE_URL}/patients`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newPatient = {
      ...body,
      id: String(MOCK_PATIENTS.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      success: true,
      data: newPatient,
      timestamp: new Date().toISOString(),
    });
  }),

  http.patch(`${API_BASE_URL}/patients/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const patient = MOCK_PATIENTS.find((p) => p.id === params.id);
    if (!patient) {
      return HttpResponse.json(
        {
          success: false,
          message: "Patient not found",
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      success: true,
      data: { ...patient, ...body, updatedAt: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });
  }),

  http.delete(`${API_BASE_URL}/patients/:id`, ({ params }) => {
    const patient = MOCK_PATIENTS.find((p) => p.id === params.id);
    if (!patient) {
      return HttpResponse.json(
        {
          success: false,
          message: "Patient not found",
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      success: true,
      data: { deleted: true, id: params.id as string },
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE_URL}/patients/:id/antecedents`, ({ params }) => {
    const patient = MOCK_PATIENTS.find((p) => p.id === params.id);
    if (!patient) {
      return HttpResponse.json(
        { success: false, message: "Patient not found" },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        patientId: params.id as string,
        allergies: ["Penicilina"],
        medications: [],
        medicalHistory: [],
        familyHistory: [],
        updatedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.put(
    `${API_BASE_URL}/patients/:id/antecedents`,
    async ({ params, request }) => {
      const patient = MOCK_PATIENTS.find((p) => p.id === params.id);
      if (!patient) {
        return HttpResponse.json(
          { success: false, message: "Patient not found" },
          { status: 404 },
        );
      }
      const body = (await request.json()) as Record<string, unknown>;
      const allergies = Array.isArray(body.allergies) ? body.allergies : [];
      const medications = Array.isArray(body.medications)
        ? body.medications
        : [];
      const medicalHistory = Array.isArray(body.medicalHistory)
        ? body.medicalHistory
        : [];
      const familyHistory = Array.isArray(body.familyHistory)
        ? body.familyHistory
        : [];
      return HttpResponse.json({
        success: true,
        data: {
          patientId: params.id as string,
          allergies,
          medications,
          medicalHistory,
          familyHistory,
          updatedAt: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    },
  ),

  http.get(`${API_BASE_URL}/dashboard/summary`, () => {
    const recentConsultations = MOCK_CLINICAL_HISTORIES.slice(0, 5).map((h) => {
      const [patientName, ...lastNameParts] = (h.patientName ?? "").split(" ");
      return {
        id: h.id,
        patientName: patientName ?? "",
        patientLastName: lastNameParts.join(" ") ?? "",
        consultationReason: h.reason,
        createdAt: h.createdAt,
      };
    });
    return HttpResponse.json({
      success: true,
      data: {
        patientsCount: MOCK_PATIENTS.length,
        appointmentsThisWeek: MOCK_APPOINTMENTS.length,
        totalHistories: MOCK_CLINICAL_HISTORIES.length,
        consultationsToday: 0,
        recentConsultations,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE_URL}/patients/:id/clinic-histories`, ({ params }) => {
    const byPatient = MOCK_CLINICAL_HISTORIES.filter(
      (h) => h.patientId === params.id,
    );
    return HttpResponse.json({
      success: true,
      data: byPatient,
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(
    `${API_BASE_URL}/patients/:patientId/clinic-histories/filter-options`,
    ({ params }) => {
      const byPatient = MOCK_CLINICAL_HISTORIES.filter(
        (h) => h.patientId === params.patientId,
      );
      const doctorIds = [
        ...new Set(
          byPatient
            .map((h) => (h as { doctorId?: string }).doctorId)
            .filter(Boolean),
        ),
      ];
      const specialtyIds = [
        ...new Set(
          byPatient
            .map((h) => (h as { specialtyId?: string }).specialtyId)
            .filter(Boolean),
        ),
      ];
      const doctors = doctorIds.map((id, i) => ({
        id: id ?? `doctor-${i}`,
        name: `Doctor`,
        lastName: `${i + 1}`,
      }));
      const specialties = specialtyIds.map((id, i) => ({
        id: id ?? `spec-${i}`,
        name:
          ["Cardiología", "Medicina General", "Psiquiatría"][i] ??
          `Especialidad ${i + 1}`,
      }));
      return HttpResponse.json({
        success: true,
        data: { doctors, specialties },
        timestamp: new Date().toISOString(),
      });
    },
  ),

  http.get(`${API_BASE_URL}/patients/:id/appointments`, ({ params }) => {
    const byPatient = MOCK_APPOINTMENTS.filter(
      (a) => a.patientId === params.id,
    );
    const backendAppointments = byPatient.map(
      convertAppointmentToBackendFormat,
    );
    return HttpResponse.json({
      success: true,
      data: backendAppointments,
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE_URL}/appointments`, () => {
    const backendAppointments = MOCK_APPOINTMENTS.map(
      convertAppointmentToBackendFormat,
    );
    return HttpResponse.json({
      success: true,
      data: {
        items: backendAppointments,
        total: backendAppointments.length,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE_URL}/appointments/specialties`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: "spec-1", name: "Cardiología" },
        { id: "spec-2", name: "Medicina General" },
      ],
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE_URL}/appointments/:id`, ({ params }) => {
    const appointment = MOCK_APPOINTMENTS.find((a) => a.id === params.id);
    if (!appointment) {
      return HttpResponse.json(
        {
          success: false,
          message: "Appointment not found",
        },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      success: true,
      data: convertAppointmentToBackendFormat(appointment),
      timestamp: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE_URL}/appointments`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newAppointment = {
      id: String(MOCK_APPOINTMENTS.length + 1),
      patientId: body.patientId || "",
      doctorId: (body.doctorId as string) ?? "doctor-1",
      specialtyId: body.specialtyId,
      startAppointment: body.startAppointment || new Date().toISOString(),
      endAppointment: body.endAppointment || new Date().toISOString(),
      reason: body.reason || "",
      status: "PENDING",
      patient: body.patient || {
        id: body.patientId || "",
        name: "New",
        lastName: "Patient",
      },
      doctor: body.doctor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      success: true,
      data: newAppointment,
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE_URL}/clinic-histories`, ({ request }) => {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const pageSize = Math.max(
      1,
      Math.min(100, parseInt(url.searchParams.get("pageSize") ?? "10", 10)),
    );
    const patientId = url.searchParams.get("patientId");
    let backendItems = MOCK_CLINICAL_HISTORIES.map(toBackendClinicalHistory);
    if (patientId) {
      backendItems = backendItems.filter(
        (item) => item.patientId === patientId,
      );
    }
    const total = backendItems.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = backendItems.slice(start, start + pageSize);
    return HttpResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE_URL}/clinic-histories/:id`, ({ params }) => {
    const history = MOCK_CLINICAL_HISTORIES.find((h) => h.id === params.id);
    if (!history) {
      return HttpResponse.json(
        {
          success: false,
          message: "Clinical history not found",
        },
        { status: 404 },
      );
    }
    const backendItem = toBackendClinicalHistory(history);
    return HttpResponse.json({
      success: true,
      data: backendItem,
      timestamp: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE_URL}/clinic-histories`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(MOCK_CLINICAL_HISTORIES.length + 1);
    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();
    const appointmentId = (body.appointmentId as string) ?? `apt-${id}`;
    const consultationReason = (body.consultationReason as string) ?? "";
    const symptoms = Array.isArray(body.symptoms)
      ? (body.symptoms as string[])
      : [String(body.symptoms ?? "")];
    const diagnostics = Array.isArray(body.diagnostics)
      ? (body.diagnostics as Array<{ name: string; description: string }>)
      : [{ name: "", description: "" }];
    const physicalExams = Array.isArray(body.physicalExams)
      ? (body.physicalExams as Array<{ name: string; description: string }>)
      : [{ name: "Examen", description: "" }];
    const vitalSignsArray = Array.isArray(body.vitalSigns)
      ? (body.vitalSigns as Array<{
          name: string;
          value: string;
          unit: string;
          measurement: string;
          description?: string;
        }>)
      : [];
    const backendItem = {
      id,
      patientId: (body.patientId as string) ?? "1",
      appointmentId,
      consultationReason,
      symptoms,
      treatment: (body.treatment as string) ?? "",
      diagnostics,
      physicalExams,
      vitalSigns:
        vitalSignsArray.length > 0
          ? vitalSignsArray
          : [
              {
                id: "1",
                name: "Presión arterial",
                value: "120/80",
                unit: "mmHg",
                measurement: "",
                description: "",
                createdAt,
                updatedAt,
              },
              {
                id: "2",
                name: "Frecuencia cardíaca",
                value: "72",
                unit: "lpm",
                measurement: "",
                description: "",
                createdAt,
                updatedAt,
              },
              {
                id: "3",
                name: "Temperatura",
                value: "36.5",
                unit: "°C",
                measurement: "",
                description: "",
                createdAt,
                updatedAt,
              },
              {
                id: "4",
                name: "Peso",
                value: "70",
                unit: "kg",
                measurement: "",
                description: "",
                createdAt,
                updatedAt,
              },
              {
                id: "5",
                name: "Altura",
                value: "170",
                unit: "cm",
                measurement: "",
                description: "",
                createdAt,
                updatedAt,
              },
            ],
      patient: {
        id: (body.patientId as string) ?? "1",
        name: "Patient",
        lastName: "",
      },
      createdAt,
      updatedAt,
    };
    return HttpResponse.json({
      success: true,
      data: backendItem,
      timestamp: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE_URL}/conversations`, () => {
    const newConv: (typeof MOCK_CONVERSATIONS)[0] = {
      id: `conv-new-${Date.now()}`,
      model: "gpt-4o-mini",
      systemPrompt: "Eres el asistente del médico.",
      summary: undefined,
      lastActivityAt: new Date(),
      isActive: true,
      doctorId: "doctor-1",
      createdAt: new Date(),
      updatedAt: new Date(),
      contextTokensUsed: 0,
      contextTokenLimit: 120_000,
      title: "Conversación nueva",
    };
    return HttpResponse.json({
      success: true,
      data: {
        ...newConv,
        lastActivityAt: newConv.lastActivityAt.toISOString(),
        createdAt: newConv.createdAt.toISOString(),
        updatedAt: newConv.updatedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE_URL}/conversations`, () => {
    return HttpResponse.json({
      success: true,
      data: MOCK_CONVERSATIONS.map((c) => ({
        ...c,
        lastActivityAt:
          c.lastActivityAt instanceof Date
            ? c.lastActivityAt.toISOString()
            : c.lastActivityAt,
        createdAt:
          c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
        updatedAt:
          c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
      })),
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE_URL}/conversations/:id/messages`, ({ params }) => {
    const messages = (MOCK_MESSAGES[params.id as string] || []).map((m) => ({
      ...m,
      createdAt:
        m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
      updatedAt:
        m.updatedAt instanceof Date ? m.updatedAt.toISOString() : m.updatedAt,
      readAt: m.readAt instanceof Date ? m.readAt.toISOString() : m.readAt,
    }));
    return HttpResponse.json({
      success: true,
      data: messages,
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE_URL}/conversations/:id`, ({ params }) => {
    const conv = MOCK_CONVERSATIONS.find((c) => c.id === params.id);
    if (!conv) {
      return HttpResponse.json(
        { type: "NotFound", status: 404 },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        ...conv,
        lastActivityAt:
          conv.lastActivityAt instanceof Date
            ? conv.lastActivityAt.toISOString()
            : conv.lastActivityAt,
        createdAt:
          conv.createdAt instanceof Date
            ? conv.createdAt.toISOString()
            : conv.createdAt,
        updatedAt:
          conv.updatedAt instanceof Date
            ? conv.updatedAt.toISOString()
            : conv.updatedAt,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.patch(`${API_BASE_URL}/conversations/:id`, async ({ params }) => {
    const conv = MOCK_CONVERSATIONS.find((c) => c.id === params.id);
    if (!conv) {
      return HttpResponse.json(
        { type: "NotFound", status: 404 },
        { status: 404 },
      );
    }
    const updated = {
      ...conv,
      lastActivityAt:
        conv.lastActivityAt instanceof Date
          ? conv.lastActivityAt.toISOString()
          : conv.lastActivityAt,
      createdAt:
        conv.createdAt instanceof Date
          ? conv.createdAt.toISOString()
          : conv.createdAt,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      success: true,
      data: updated,
      timestamp: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE_URL}/messages`, async ({ request }) => {
    const body = (await request.json()) as {
      conversationId: string;
      role?: string;
      content: string;
    };
    const newMessage = {
      id: `m-${Date.now()}`,
      conversationId: body.conversationId,
      role: body.role ?? "user",
      content: body.content ?? "",
      tokenCount: Math.ceil((body.content?.length ?? 0) / 4),
      readAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({
      success: true,
      data: newMessage,
      timestamp: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { phone: string; password: string };
    if (body.phone === "+584241234567" && body.password === "password123") {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            id: "1",
            name: "Test",
            lastName: "User",
            phone: body.phone,
            email: "test@test.com",
          },
          accessToken: "mock-token",
        },
        timestamp: new Date().toISOString(),
      });
    }
    return HttpResponse.json(
      {
        success: false,
        message: "Invalid credentials",
      },
      { status: 401 },
    );
  }),

  http.post(`${API_BASE_URL}/auth/forgot-password`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        message:
          "Si el número está registrado, recibirás un código por WhatsApp en los próximos minutos.",
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE_URL}/auth/reset-password`, async () => {
    return HttpResponse.json({
      success: true,
      data: { message: "Contraseña actualizada correctamente" },
      timestamp: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE_URL}/auth/logout`, async () => {
    return HttpResponse.json({
      success: true,
      data: null,
      message: "Logged out successfully",
      timestamp: new Date().toISOString(),
    });
  }),

  http.patch(
    `${API_BASE_URL}/appointments/:id`,
    async ({ params, request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      const appointment = MOCK_APPOINTMENTS.find((a) => a.id === params.id);
      if (!appointment) {
        return HttpResponse.json(
          {
            success: false,
            message: "Appointment not found",
          },
          { status: 404 },
        );
      }
      const updated = { ...appointment, ...body };
      return HttpResponse.json({
        success: true,
        data: convertAppointmentToBackendFormat(updated),
        timestamp: new Date().toISOString(),
      });
    },
  ),

  http.put(`${API_BASE_URL}/appointments/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const appointment = MOCK_APPOINTMENTS.find((a) => a.id === params.id);
    if (!appointment) {
      return HttpResponse.json(
        {
          success: false,
          message: "Appointment not found",
        },
        { status: 404 },
      );
    }
    const updated = { ...appointment, ...body };
    return HttpResponse.json({
      success: true,
      data: convertAppointmentToBackendFormat(updated),
      timestamp: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE_URL}/appointments/:id/cancel`, async ({ params }) => {
    const appointment = MOCK_APPOINTMENTS.find((a) => a.id === params.id);
    if (!appointment) {
      return HttpResponse.json(
        {
          success: false,
          message: "Appointment not found",
        },
        { status: 404 },
      );
    }
    const cancelled = { ...appointment, status: "cancelled" as const };
    return HttpResponse.json({
      success: true,
      data: convertAppointmentToBackendFormat(cancelled),
      timestamp: new Date().toISOString(),
    });
  }),

  http.put(`${API_BASE_URL}/appointments/:id/cancel`, async ({ params }) => {
    const appointment = MOCK_APPOINTMENTS.find((a) => a.id === params.id);
    if (!appointment) {
      return HttpResponse.json(
        {
          success: false,
          message: "Appointment not found",
        },
        { status: 404 },
      );
    }
    const cancelled = { ...appointment, status: "cancelled" as const };
    return HttpResponse.json({
      success: true,
      data: convertAppointmentToBackendFormat(cancelled),
      timestamp: new Date().toISOString(),
    });
  }),

  http.put(`${API_BASE_URL}/conversations/:id/read`, async () => {
    return HttpResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  }),

  http.post(`${API_BASE_URL}/twilio/whatsapp/send`, async ({ request }) => {
    const body = (await request.json()) as { to?: string; body?: string };
    if (!body.to || !body.body) {
      return HttpResponse.json(
        { success: false, message: "to and body are required" },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        messageSid: `SM${Date.now()}`,
        status: "queued",
        to: body.to,
        from: "whatsapp:+15675871709",
        body: body.body,
        dateCreated: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE_URL}/twilio/message//status`, () =>
    HttpResponse.json(
      { success: false, message: "Invalid messageSid" },
      { status: 400 },
    ),
  ),

  http.get(
    `${API_BASE_URL}/twilio/message/:messageSid/status`,
    ({ params }) => {
      const messageSid = params.messageSid as string;
      if (!messageSid || messageSid.length < 10) {
        return HttpResponse.json(
          { success: false, message: "Invalid messageSid" },
          { status: 400 },
        );
      }
      return HttpResponse.json({
        success: true,
        data: {
          sid: messageSid,
          status: "delivered",
          to: "whatsapp:+59170000001",
          from: "whatsapp:+15675871709",
          body: "Test message",
          dateCreated: new Date().toISOString(),
          dateSent: new Date().toISOString(),
          dateUpdated: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    },
  ),
];
