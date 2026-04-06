import { z } from "zod";
import { client } from "@/lib/api/client";
import { ApiResponseSchema, PaginatedResponseSchema } from "@/types/contracts/api-response";
import type { PaginatedData } from "@/types/contracts/api-response";
import { doctorSchema } from "../schemas/doctor.schema";
import type { Doctor, CreateDoctorRequest, UpdateDoctorRequest, DoctorsListParams } from "../types/doctor.types";

const DOCTORS_ENDPOINT = "/admin/doctors";
const SingleDoctorSchema = z.union([
  doctorSchema,
  z.array(doctorSchema).min(1).transform(([doctor]) => doctor),
]);

export async function getDoctors(params?: DoctorsListParams): Promise<PaginatedData<Doctor>> {
  const response = await client.get(
    DOCTORS_ENDPOINT,
    PaginatedResponseSchema(doctorSchema),
    { params }
  );
  return response.data;
}

export async function getDoctorById(id: string): Promise<Doctor> {
  const response = await client.get(
    `${DOCTORS_ENDPOINT}/${id}`,
    ApiResponseSchema(SingleDoctorSchema)
  );
  return response.data;
}

export async function createDoctor(data: CreateDoctorRequest): Promise<Doctor> {
  const response = await client.post(
    DOCTORS_ENDPOINT,
    data,
    ApiResponseSchema(doctorSchema)
  );
  return response.data;
}

export async function updateDoctor(id: string, data: UpdateDoctorRequest): Promise<Doctor> {
  const response = await client.patch(
    `${DOCTORS_ENDPOINT}/${id}`,
    data,
    ApiResponseSchema(doctorSchema)
  );
  return response.data;
}

export async function deactivateDoctor(id: string): Promise<Doctor> {
  const response = await client.post(
    `${DOCTORS_ENDPOINT}/${id}/deactivate`,
    {},
    ApiResponseSchema(doctorSchema)
  );
  return response.data;
}

export async function activateDoctor(id: string): Promise<Doctor> {
  const response = await client.post(
    `${DOCTORS_ENDPOINT}/${id}/activate`,
    {},
    ApiResponseSchema(doctorSchema)
  );
  return response.data;
}
