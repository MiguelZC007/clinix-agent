import type { CreateClinicHistoryDto } from '../clinic-history/dto/create-clinic-history.dto';
import type { CreateClinicHistoryWithoutAppointmentDto } from '../clinic-history/dto/create-clinic-history-without-appointment.dto';

export type StructuringErrorCategory =
  | 'MODEL_CAPABILITY'
  | 'STRUCTURE_VALIDATION'
  | 'SEMANTIC_VALIDATION'
  | 'PROVIDER_RUNTIME';

export interface StructureAnamnesisInput {
  text: string;
  mode: 'WITH_APPOINTMENT' | 'WITHOUT_APPOINTMENT';
  appointmentId?: string;
  patientRef?: { patientId?: string; patientNumber?: number };
  specialtyRef?: { specialtyId?: string; specialtyCode?: number };
}

export interface StructureAnamnesisError {
  category: StructuringErrorCategory;
  code: string;
  message: string;
  fields?: string[];
}

export interface StructureAnamnesisResult {
  ok: boolean;
  data?: CreateClinicHistoryDto | CreateClinicHistoryWithoutAppointmentDto;
  error?: StructureAnamnesisError;
}
