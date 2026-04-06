export interface CreateClinicHistoryBackendDiagnostic {
  name: string;
  description: string;
}

export interface CreateClinicHistoryBackendPhysicalExam {
  name: string;
  description: string;
}

export interface CreateClinicHistoryBackendVitalSign {
  name: string;
  value: string;
  unit: string;
  measurement: string;
  description?: string;
}

export interface CreateClinicHistoryBackendPayload {
  appointmentId: string;
  consultationReason: string;
  symptoms: string[];
  treatment: string;
  diagnostics: CreateClinicHistoryBackendDiagnostic[];
  physicalExams: CreateClinicHistoryBackendPhysicalExam[];
  vitalSigns: CreateClinicHistoryBackendVitalSign[];
}
