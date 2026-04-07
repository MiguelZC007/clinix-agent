"use client";

import { useAuth } from "@/lib/auth/hooks";
import type { UserRole } from "@/lib/auth/types";

type DoctorWithOptionalRole = {
  userId: string;
  role?: UserRole;
  [key: string]: unknown;
};

type UseRoleChangeGuardParams = {
  doctor: DoctorWithOptionalRole;
  /** El rol actualmente seleccionado en el formulario (undefined = sin cambio pendiente) */
  currentRole: UserRole | undefined;
};

type RoleChangeGuard = {
  /** true si el backend devolvió `role` en el contrato del doctor */
  isRoleSupported: boolean;
  /** true si el doctor cargado es el propio admin autenticado */
  isSelfAdmin: boolean;
  /** true si isSelfAdmin y el currentRole elegido no es ADMIN */
  isSelfDemotionBlocked: boolean;
  /** true si isRoleSupported y currentRole difiere del role original del doctor */
  requiresConfirmation: boolean;
};

/**
 * Centraliza las reglas de negocio derivadas de auth + doctor para edición de roles.
 * Puro en lógica: no produce side effects, fácil de testear.
 */
export function useRoleChangeGuard({
  doctor,
  currentRole,
}: UseRoleChangeGuardParams): RoleChangeGuard {
  const { user } = useAuth();

  const isRoleSupported = doctor.role !== undefined;
  const isSelfAdmin = user?.id === doctor.userId;
  const isSelfDemotionBlocked = isSelfAdmin && currentRole !== undefined && currentRole !== "ADMIN";
  const requiresConfirmation =
    isRoleSupported &&
    currentRole !== undefined &&
    currentRole !== doctor.role;

  return {
    isRoleSupported,
    isSelfAdmin,
    isSelfDemotionBlocked,
    requiresConfirmation,
  };
}
