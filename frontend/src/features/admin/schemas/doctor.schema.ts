import { z } from "zod";

export const doctorSchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string(),
  specialtyId: z.string(),
  specialtyName: z.string(),
  licenseNumber: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Doctor = z.infer<typeof doctorSchema>;

export const createDoctorFormSchema = z.object({
  email: z.string().min(1, "errors.required").email("errors.invalidEmail"),
  name: z.string().min(1, "errors.required").min(2, "errors.minLength").max(100, "errors.maxLength"),
  lastName: z.string().min(1, "errors.required").min(2, "errors.minLength").max(100, "errors.maxLength"),
  phone: z.string().min(1, "errors.required"),
  specialtyId: z.string().min(1, "errors.required"),
  licenseNumber: z.string().min(1, "errors.required").min(2, "errors.minLength").max(50, "errors.maxLength"),
  password: z.string().min(6, "errors.minLength6").optional(),
});

export type CreateDoctorFormData = z.infer<typeof createDoctorFormSchema>;

export const updateDoctorFormSchema = z.object({
  name: z.string().min(1, "errors.required").min(2, "errors.minLength").max(100, "errors.maxLength").optional(),
  lastName: z.string().min(1, "errors.required").min(2, "errors.minLength").max(100, "errors.maxLength").optional(),
  specialtyId: z.string().min(1, "errors.required").optional(),
  licenseNumber: z.string().min(1, "errors.required").min(2, "errors.minLength").max(50, "errors.maxLength").optional(),
}).refine(
  (data) => data.name || data.lastName || data.specialtyId || data.licenseNumber,
  { message: "errors.atLeastOneField", path: ["name"] },
);

export type UpdateDoctorFormData = z.infer<typeof updateDoctorFormSchema>;

export const doctorsListResponseSchema = z.object({
  items: z.array(doctorSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});
