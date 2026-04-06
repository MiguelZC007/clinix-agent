export type {
  VitalSigns,
  ClinicalHistory,
} from "../schemas/clinical-history.schema";
import type { ClinicalHistory } from "../schemas/clinical-history.schema";

export type CreateClinicalHistoryRequest = Omit<
  ClinicalHistory,
  "id" | "patientName" | "createdAt" | "updatedAt"
>;

export type ClinicalHistoriesListParams = {
  page?: number;
  pageSize?: number;
  patientId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
  specialtyId?: string;
};
