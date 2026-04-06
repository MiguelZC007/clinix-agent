import { z } from "zod";
import { client } from "@/lib/api/client";
import type {
  PaginatedData,
  ApiResponse,
  PaginatedResponse,
} from "@/types/contracts/api-response";
import { ApiResponseSchema } from "@/types/contracts/api-response";
import { mapAppointmentFromBackend } from "../utils/appointment.mapper";
import type {
  Appointment,
  AppointmentBackend,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentsListParams,
  Specialty,
} from "../types/appointment.types";

const specialtyItemSchema = z.object({ id: z.string(), name: z.string() });
const specialtiesResponseSchema = ApiResponseSchema(
  z.array(specialtyItemSchema),
);

const ENDPOINT = "/appointments";

function unwrapResponse<T>(
  response: ApiResponse<T> | BackendPaginatedResponse<T> | T | unknown,
): T {
  if (typeof response === "object" && response !== null) {
    if ("data" in response) {
      const data = (response as { data: unknown }).data;
      if (
        typeof data === "object" &&
        data !== null &&
        "data" in data &&
        !("meta" in data)
      ) {
        return data.data as T;
      }
      return data as T;
    }
  }
  return response as T;
}

interface BackendPaginatedResponse<T> {
  success: boolean;
  data: {
    data: T[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  timestamp: string;
}

function unwrapPaginatedResponse<T>(
  response:
    | BackendPaginatedResponse<T>
    | PaginatedResponse<T>
    | PaginatedData<T>
    | unknown,
): PaginatedData<T> {
  if (typeof response === "object" && response !== null) {
    if (
      "data" in response &&
      typeof response.data === "object" &&
      response.data !== null
    ) {
      const data = response.data as Record<string, unknown>;
      if ("data" in data && "meta" in data && Array.isArray(data.data)) {
        const backendResponse = response as BackendPaginatedResponse<T>;
        return {
          items: backendResponse.data.data,
          total: backendResponse.data.meta.total,
          page: backendResponse.data.meta.page,
          pageSize: backendResponse.data.meta.limit,
          totalPages: backendResponse.data.meta.totalPages,
        };
      }
      if ("items" in data) {
        return data as PaginatedData<T>;
      }
      if (Array.isArray(data)) {
        return {
          items: data,
          total: data.length,
          page: 1,
          pageSize: data.length,
          totalPages: 1,
        };
      }
    }
    if ("items" in response) {
      return response as PaginatedData<T>;
    }
  }
  return {
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  } as PaginatedData<T>;
}

export async function getAppointments(
  params?: AppointmentsListParams,
): Promise<PaginatedData<Appointment>> {
  const queryParams: Record<string, unknown> = {};

  if (params?.page !== undefined) {
    queryParams.page = params.page;
  }

  if (params?.limit !== undefined) {
    queryParams.limit = params.limit;
  } else if (params?.pageSize !== undefined) {
    queryParams.limit = params.pageSize;
  }

  if (params?.startDate) {
    queryParams.startDate = params.startDate;
  }

  if (params?.endDate) {
    queryParams.endDate = params.endDate;
  }

  if (params?.status) {
    queryParams.status = params.status.toUpperCase();
  }

  if (params?.date) {
    queryParams.date = params.date;
  }

  const response = await client.get<
    | BackendPaginatedResponse<AppointmentBackend>
    | PaginatedResponse<AppointmentBackend>
    | PaginatedData<AppointmentBackend>
  >(ENDPOINT, undefined, { params: queryParams });
  const paginatedData = unwrapPaginatedResponse<AppointmentBackend>(response);
  const items: AppointmentBackend[] = Array.isArray(paginatedData?.items)
    ? (paginatedData.items as AppointmentBackend[])
    : [];
  return {
    items: items.map(mapAppointmentFromBackend),
    total: paginatedData?.total ?? 0,
    page: paginatedData?.page ?? 1,
    pageSize: paginatedData?.pageSize ?? 10,
    totalPages: paginatedData?.totalPages ?? 0,
  };
}

export async function getAppointmentById(id: string): Promise<Appointment> {
  const response = await client.get<
    ApiResponse<AppointmentBackend> | AppointmentBackend
  >(`${ENDPOINT}/${id}`);
  const data = unwrapResponse<AppointmentBackend>(response);
  return mapAppointmentFromBackend(data);
}

export async function createAppointment(
  data: CreateAppointmentRequest,
): Promise<Appointment> {
  const response = await client.post<
    ApiResponse<AppointmentBackend> | AppointmentBackend,
    CreateAppointmentRequest
  >(ENDPOINT, data);
  const backendData = unwrapResponse<AppointmentBackend>(response);
  return mapAppointmentFromBackend(backendData);
}

export async function updateAppointment(
  id: string,
  data: UpdateAppointmentRequest,
): Promise<Appointment> {
  const response = await client.patch<
    ApiResponse<AppointmentBackend> | AppointmentBackend,
    UpdateAppointmentRequest
  >(`${ENDPOINT}/${id}`, data);
  const backendData = unwrapResponse<AppointmentBackend>(response);
  return mapAppointmentFromBackend(backendData);
}

export async function cancelAppointment(id: string): Promise<Appointment> {
  const response = await client.post<
    ApiResponse<AppointmentBackend> | AppointmentBackend,
    Record<string, never>
  >(`${ENDPOINT}/${id}/cancel`, {});
  const backendData = unwrapResponse<AppointmentBackend>(response);
  return mapAppointmentFromBackend(backendData);
}

export async function getAppointmentsByPatient(
  patientId: string,
): Promise<Appointment[]> {
  const response = await client.get<
    ApiResponse<AppointmentBackend[]> | AppointmentBackend[]
  >(`/patients/${patientId}/appointments`);
  const data = unwrapResponse<AppointmentBackend[]>(response);
  const appointments = Array.isArray(data) ? data : [];
  return appointments.map(mapAppointmentFromBackend);
}

export async function getSpecialties(): Promise<Specialty[]> {
  const response = await client.get<{
    success: boolean;
    data: Specialty[];
    timestamp: string;
  }>(`${ENDPOINT}/specialties`, specialtiesResponseSchema);
  return response.data;
}
