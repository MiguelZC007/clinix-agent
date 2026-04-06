import { client } from '@/lib/api/client';
import { ApiResponseSchema } from '@/types/contracts/api-response';
import { dashboardSummarySchema } from '../schemas/dashboard.schema';
import type { DashboardSummary } from '../types/dashboard.types';

const DASHBOARD_SUMMARY_ENDPOINT = '/dashboard/summary';

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await client.get(
    DASHBOARD_SUMMARY_ENDPOINT,
    ApiResponseSchema(dashboardSummarySchema)
  );
  return response.data;
}
