import { z } from 'zod';
import { client } from '@/lib/api/client';
import { ApiResponseSchema, PaginatedResponseSchema } from '@/types/contracts/api-response';
import type { PaginatedData } from '@/types/contracts/api-response';
import { patientSchema, patientAntecedentsSchema } from '../schemas/patient.schema';
import type { Patient, CreatePatientRequest, UpdatePatientRequest, PatientsListParams, PatientAntecedents, UpdatePatientAntecedentsRequest } from '../types/patient.types';

const PATIENTS_ENDPOINT = '/patients';
const SinglePatientSchema = z.union([
  patientSchema,
  z.array(patientSchema).min(1).transform(([patient]) => patient),
]);
const deletePatientResponseSchema = ApiResponseSchema(
  z.object({ deleted: z.literal(true), id: z.string() }),
);

export async function getPatients(params?: PatientsListParams): Promise<PaginatedData<Patient>> {
  const response = await client.get(
    PATIENTS_ENDPOINT,
    PaginatedResponseSchema(patientSchema),
    { params }
  );
  return response.data;
}

export async function getPatientById(id: string): Promise<Patient> {
  const response = await client.get(
    `${PATIENTS_ENDPOINT}/${id}`,
    ApiResponseSchema(SinglePatientSchema)
  );
  return response.data;
}

export async function createPatient(data: CreatePatientRequest): Promise<Patient> {
  const response = await client.post(
    PATIENTS_ENDPOINT,
    data,
    ApiResponseSchema(patientSchema)
  );
  return response.data;
}

export async function updatePatient(id: string, data: UpdatePatientRequest): Promise<Patient> {
  const response = await client.patch(
    `${PATIENTS_ENDPOINT}/${id}`,
    data,
    ApiResponseSchema(patientSchema)
  );
  return response.data;
}

export async function deletePatient(
  id: string,
): Promise<{ deleted: true; id: string }> {
  const response = await client.delete(
    `${PATIENTS_ENDPOINT}/${id}`,
    deletePatientResponseSchema,
  );
  return response.data;
}

export async function getPatientAntecedents(id: string): Promise<PatientAntecedents> {
  const response = await client.get(
    `${PATIENTS_ENDPOINT}/${id}/antecedents`,
    ApiResponseSchema(patientAntecedentsSchema)
  );
  return response.data;
}

export async function updatePatientAntecedents(id: string, data: UpdatePatientAntecedentsRequest): Promise<PatientAntecedents> {
  const response = await client.put(
    `${PATIENTS_ENDPOINT}/${id}/antecedents`,
    data,
    ApiResponseSchema(patientAntecedentsSchema)
  );
  return response.data;
}
