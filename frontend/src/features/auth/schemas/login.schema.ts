import { z } from 'zod';

export const loginSchema = z.object({
  phone: z.string().min(1, 'errors.required'),
  password: z.string().min(6, 'errors.minLength'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  phone: z.string().min(1, 'errors.required'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    phone: z.string().min(1, 'errors.required'),
    code: z.string().length(6, 'errors.invalidOtp'),
    newPassword: z.string().min(6, 'errors.minLength'),
    confirmPassword: z.string().min(6, 'errors.minLength'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'errors.passwordsDoNotMatch',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
