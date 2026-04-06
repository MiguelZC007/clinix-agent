import { z } from "zod";

export const vitalSignsSchema = z.object({
  bloodPressure: z.string(),
  heartRate: z.number(),
  temperature: z.number(),
  weight: z.number(),
  height: z.number(),
});
export type VitalSigns = z.infer<typeof vitalSignsSchema>;

export const clinicalHistorySchema = z.object({
  id: z.string(),
  patientId: z.string(),
  patientName: z.string().optional(),
  doctorName: z.string().optional(),
  doctorSpecialty: z.string().optional(),
  reason: z.string(),
  symptoms: z.string(),
  physicalExam: z.string(),
  diagnosis: z.string(),
  treatment: z.string(),
  notes: z.string().optional(),
  vitalSigns: vitalSignsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ClinicalHistory = z.infer<typeof clinicalHistorySchema>;

export const vitalSignsFormSchema = z.object({
  bloodPressure: z.string().min(1, "errors.required"),
  heartRate: z.number().min(1, "errors.required"),
  temperature: z.number().min(0.1, "errors.required"),
  weight: z.number().min(0.1, "errors.required"),
  height: z.number().min(1, "errors.required"),
});

export const clinicalHistoryFormSchema = z.object({
  patientId: z.string().min(1, "errors.required"),
  appointmentId: z.string().min(1, "clinicalHistories.appointmentRequired"),
  reason: z.string().min(1, "errors.required"),
  symptoms: z.string().min(1, "errors.required"),
  physicalExam: z.string().min(1, "errors.required"),
  diagnosis: z.string().min(1, "errors.required"),
  treatment: z.string().min(1, "errors.required"),
  vitalSigns: vitalSignsFormSchema,
});
export type ClinicalHistoryFormData = z.infer<typeof clinicalHistoryFormSchema>;

export const clinicalHistoriesListResponseSchema = z.object({
  items: z.array(clinicalHistorySchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

const diagnosticBackendSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});

const physicalExamBackendSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});

const vitalSignBackendSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  value: z.string(),
  unit: z.string(),
  measurement: z.string(),
  description: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
});

export const clinicalHistoryBackendSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  doctorId: z.string().optional(),
  specialtyId: z.string().optional(),
  appointmentId: z.string().nullable(),
  consultationReason: z.string(),
  symptoms: z.array(z.string()),
  treatment: z.string(),
  diagnostics: z.array(diagnosticBackendSchema),
  physicalExams: z.array(physicalExamBackendSchema),
  vitalSigns: z.array(vitalSignBackendSchema),
  prescription: z.unknown().optional(),
  patient: z
    .object({ id: z.string(), name: z.string(), lastName: z.string() })
    .optional(),
  doctor: z
    .object({
      id: z.string(),
      name: z.string(),
      lastName: z.string(),
      specialty: z.string().optional(),
    })
    .optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

type ClinicalHistoryBackend = z.infer<typeof clinicalHistoryBackendSchema>;

function formatDate(v: string | Date): string {
  return typeof v === "string" ? v : v.toISOString();
}

function findVitalSign(
  vitalSigns: ClinicalHistoryBackend["vitalSigns"],
  predicate: (vs: (typeof vitalSigns)[number]) => boolean,
  name: string,
): string | undefined {
  const found = vitalSigns.find(predicate);
  if (found) return found.value;
  console.warn(
    `[mapClinicalHistoryFromBackend] Unknown vital sign type: ${name}`,
  );
  return undefined;
}

export function mapClinicalHistoryFromBackend(
  b: ClinicalHistoryBackend,
): ClinicalHistory {
  const bloodPressure =
    findVitalSign(
      b.vitalSigns,
      (vs) =>
        vs.name?.toLowerCase().includes("presión") ||
        vs.name?.toLowerCase().includes("presion"),
      "bloodPressure",
    ) ?? "";
  const heartRate =
    findVitalSign(
      b.vitalSigns,
      (vs) =>
        vs.name?.toLowerCase().includes("cardíac") ||
        vs.name?.toLowerCase().includes("cardiac"),
      "heartRate",
    ) ?? "0";
  const temperature =
    findVitalSign(
      b.vitalSigns,
      (vs) => vs.name?.toLowerCase().includes("temperatura"),
      "temperature",
    ) ?? "0";
  const weight =
    findVitalSign(
      b.vitalSigns,
      (vs) => vs.name?.toLowerCase().includes("peso"),
      "weight",
    ) ?? "0";
  const height =
    findVitalSign(
      b.vitalSigns,
      (vs) =>
        vs.name?.toLowerCase().includes("talla") ||
        vs.name?.toLowerCase().includes("altura"),
      "height",
    ) ?? "0";
  const parseNum = (s: string): number => {
    const n = parseFloat(s.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };
  const patientName = b.patient
    ? `${b.patient.name} ${b.patient.lastName}`.trim()
    : undefined;
  const doctorName = b.doctor
    ? `${b.doctor.name} ${b.doctor.lastName}`.trim()
    : undefined;
  const doctorSpecialty = b.doctor?.specialty;
  return {
    id: b.id,
    patientId: b.patientId,
    patientName,
    doctorName,
    doctorSpecialty,
    reason: b.consultationReason,
    symptoms: Array.isArray(b.symptoms) ? b.symptoms.join(", ") : "",
    physicalExam:
      b.physicalExams.map((e) => `${e.name}: ${e.description}`).join("; ") ||
      "",
    diagnosis:
      b.diagnostics.map((d) => `${d.name}: ${d.description}`).join("; ") || "",
    treatment: b.treatment,
    notes: "",
    vitalSigns: {
      bloodPressure,
      heartRate: parseNum(heartRate),
      temperature: parseNum(temperature),
      weight: parseNum(weight),
      height: parseNum(height),
    },
    createdAt: formatDate(b.createdAt),
    updatedAt: formatDate(b.updatedAt),
  };
}
