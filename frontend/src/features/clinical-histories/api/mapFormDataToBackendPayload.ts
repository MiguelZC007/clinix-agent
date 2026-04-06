import type { ClinicalHistoryFormData } from '../schemas/clinical-history.schema';
import type { CreateClinicHistoryBackendPayload } from '../types/create-clinical-history-backend.types';

function toSymptomsArray(symptoms: string): string[] {
  const parts = symptoms
    .split(/[\n,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [symptoms];
}

export function mapFormDataToBackendPayload(
  data: ClinicalHistoryFormData,
  appointmentId: string
): CreateClinicHistoryBackendPayload {
  const v = data.vitalSigns;
  return {
    appointmentId,
    consultationReason: data.reason,
    symptoms: toSymptomsArray(data.symptoms),
    treatment: data.treatment,
    diagnostics: [{ name: 'Diagnóstico', description: data.diagnosis }],
    physicalExams: [{ name: 'Examen físico', description: data.physicalExam }],
    vitalSigns: [
      { name: 'Presión arterial', value: v.bloodPressure, unit: 'mmHg', measurement: 'sistólica/diastólica' },
      { name: 'Frecuencia cardíaca', value: String(v.heartRate), unit: 'lpm', measurement: 'pulsos' },
      { name: 'Temperatura', value: String(v.temperature), unit: '°C', measurement: 'axilar' },
      { name: 'Peso', value: String(v.weight), unit: 'kg', measurement: 'peso corporal' },
      { name: 'Altura', value: String(v.height), unit: 'cm', measurement: 'talla' },
    ],
  };
}
