import { z } from "zod";
import { client } from "@/lib/api/client";
import { ApiResponseSchema, PaginatedResponseSchema } from "@/types/contracts/api-response";
import type { PaginatedData } from "@/types/contracts/api-response";

export const auditLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string().optional(),
  userEmail: z.string().optional(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  previousState: z.record(z.string(), z.unknown()).nullable(),
  newState: z.record(z.string(), z.unknown()).nullable(),
  result: z.string(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

export type AuditLogsParams = {
  page?: number;
  pageSize?: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
};

const AUDIT_LOGS_ENDPOINT = "/admin/audit-logs";

export async function getAuditLogs(params?: AuditLogsParams): Promise<PaginatedData<AuditLog>> {
  const response = await client.get(
    AUDIT_LOGS_ENDPOINT,
    PaginatedResponseSchema(auditLogSchema),
    { params }
  );
  return response.data;
}

export async function getAuditLogById(id: string): Promise<AuditLog> {
  const response = await client.get(
    `${AUDIT_LOGS_ENDPOINT}/${id}`,
    ApiResponseSchema(auditLogSchema)
  );
  return response.data;
}
