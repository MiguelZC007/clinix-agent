import { z } from 'zod';

const recentConsultationSchema = z.object({
  id: z.string(),
  patientName: z.string(),
  patientLastName: z.string(),
  consultationReason: z.string(),
  createdAt: z.string(),
});

export const dashboardSummarySchema = z.object({
  patientsCount: z.number(),
  appointmentsThisWeek: z.number(),
  totalHistories: z.number(),
  consultationsToday: z.number(),
  recentConsultations: z.array(recentConsultationSchema),
});
