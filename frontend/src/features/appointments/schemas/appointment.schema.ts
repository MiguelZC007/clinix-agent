import { z } from "zod";

export const appointmentStatusSchema = z.enum([
  "scheduled",
  "completed",
  "cancelled",
  "pending",
  "confirmed",
]);
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

export const appointmentFormSchema = z
  .object({
    patientId: z.string().min(1, "errors.required"),
    specialtyId: z.string().min(1, "errors.required"),
    date: z.string().min(1, "errors.required"),
    startTime: z.string().min(1, "errors.required"),
    endTime: z.string().min(1, "errors.required"),
    reason: z.string().min(3, "errors.minLength").max(500, "errors.maxLength"),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "errors.endTimeBeforeStart",
    path: ["endTime"],
  });
export type AppointmentFormData = z.infer<typeof appointmentFormSchema>;
