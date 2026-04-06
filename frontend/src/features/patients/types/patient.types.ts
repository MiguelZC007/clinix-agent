export type { Patient, PatientAntecedents, UpdatePatientAntecedentsRequest } from '../schemas/patient.schema';
import type { Patient } from '../schemas/patient.schema';

export type CreatePatientRequest = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> & { password?: string };

export type UpdatePatientRequest = Partial<CreatePatientRequest>;

export type PatientsListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
};
