import { z } from 'zod';

export const ProblemDetailsSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  status: z.number().optional(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  code: z.string().optional(), // Código de error específico (ej: AUTH_001)
  errors: z.record(z.string(), z.array(z.string())).optional(), // Para errores de validación
});

export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;
