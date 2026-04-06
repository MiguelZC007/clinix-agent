import { z } from "zod";
import { client } from "@/lib/api/client";
import {
  ApiResponseSchema,
  PaginatedResponseSchema,
} from "@/types/contracts/api-response";
import type { PaginatedData } from "@/types/contracts/api-response";
import {
  clinicalHistoryBackendSchema,
  mapClinicalHistoryFromBackend,
} from "../schemas/clinical-history.schema";
import type {
  ClinicalHistory,
  ClinicalHistoriesListParams,
} from "../types/clinical-history.types";
import type { CreateClinicHistoryBackendPayload } from "../types/create-clinical-history-backend.types";

const ENDPOINT = "/clinic-histories";

function parseApiData<T>(response: { data: T }): T {
  return response.data;
}

export async function getClinicalHistories(
  params?: ClinicalHistoriesListParams,
): Promise<PaginatedData<ClinicalHistory>> {
  const response = await client.get(
    ENDPOINT,
    PaginatedResponseSchema(clinicalHistoryBackendSchema),
    { params },
  );
  const paginated = response.data;
  return {
    ...paginated,
    items: paginated.items.map(mapClinicalHistoryFromBackend),
  };
}

export async function getClinicalHistoryById(
  id: string,
): Promise<ClinicalHistory> {
  const response = await client.get(
    `${ENDPOINT}/${id}`,
    ApiResponseSchema(clinicalHistoryBackendSchema),
  );
  const data = parseApiData(response);
  return mapClinicalHistoryFromBackend(data);
}

export async function createClinicalHistory(
  data: CreateClinicHistoryBackendPayload,
): Promise<ClinicalHistory> {
  const response = await client.post(
    ENDPOINT,
    data,
    ApiResponseSchema(clinicalHistoryBackendSchema),
  );
  const apiData = parseApiData(response);
  return mapClinicalHistoryFromBackend(apiData);
}

export async function getClinicalHistoriesByPatient(
  patientId: string,
): Promise<ClinicalHistory[]> {
  const response = await client.get(
    `/patients/${patientId}/clinic-histories`,
    ApiResponseSchema(z.array(clinicalHistoryBackendSchema)),
  );
  const data = parseApiData(response);
  const arr = Array.isArray(data) ? data : [];
  return arr.map(mapClinicalHistoryFromBackend);
}

const patientClinicHistoryFilterOptionsSchema = z.object({
  doctors: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      lastName: z.string(),
    }),
  ),
  specialties: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
});

export type PatientClinicHistoryFilterOptions = z.infer<
  typeof patientClinicHistoryFilterOptionsSchema
>;

export async function getPatientClinicHistoryFilterOptions(
  patientId: string,
): Promise<PatientClinicHistoryFilterOptions> {
  const response = await client.get(
    `/patients/${patientId}/clinic-histories/filter-options`,
    ApiResponseSchema(patientClinicHistoryFilterOptionsSchema),
  );
  return response.data;
}
