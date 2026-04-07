"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/lib/auth/types";

/** Roles available for selection in the admin role management UI.
 * Only DOCTOR and ADMIN roles are selectable in this UI.
 * PATIENT role is excluded because:
 * - Doctors cannot be demoted to patients in the admin doctor management screen
 * - This selector is used within the doctor edit/create flow, not patient management
 * - The business rule is: only elevated roles (DOCTOR, ADMIN) can be assigned to medical staff
 */
const SELECTABLE_ROLES: UserRole[] = ["DOCTOR", "ADMIN"];

type RoleSelectorProps = {
  value: UserRole | undefined;
  onChange: (role: UserRole) => void;
  disabled: boolean;
  /** true when backend contract does not support role management yet */
  isUnsupported: boolean;
  helperText?: string;
};

/**
 * RHF-friendly role selector for the doctor edit form.
 * Shows a degraded unsupported message when backend lacks role support.
 */
export function RoleSelector({
  value,
  onChange,
  disabled,
  isUnsupported,
  helperText,
}: RoleSelectorProps) {
  const t = useTranslations();

  if (isUnsupported) {
    return (
      <div>
        <label className="text-sm font-medium leading-none">
          {t("doctors.role")}
        </label>
        <p
          className="text-sm text-muted-foreground mt-1"
          data-testid="role-unsupported-message"
        >
          {t("doctors.roleUnsupported")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium leading-none">
        {t("doctors.role")}
      </label>
      <Select
        onValueChange={(val) => onChange(val as UserRole)}
        value={value}
        disabled={disabled}
      >
        <SelectTrigger data-testid="select-role" disabled={disabled}>
          <SelectValue placeholder={t("doctors.role")}>
            {value ? t(`doctors.role${value}`) : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SELECTABLE_ROLES.map((role) => (
            <SelectItem
              key={role}
              value={role}
              data-testid={`role-option-${role}`}
            >
              {t(`doctors.role${role}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helperText && (
        <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
      )}
    </div>
  );
}
