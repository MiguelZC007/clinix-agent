"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Specialty = {
  id: string;
  name: string;
};

type DoctorFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  isActive?: boolean;
  onIsActiveChange: (value: boolean | undefined) => void;
  specialtyId?: string;
  onSpecialtyChange: (value: string | undefined) => void;
  specialties: Specialty[];
};

export function DoctorFilters({
  search,
  onSearchChange,
  isActive,
  onIsActiveChange,
  specialtyId,
  onSpecialtyChange,
  specialties,
}: DoctorFiltersProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-wrap items-end gap-4" data-testid="doctor-filters">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("doctors.searchPlaceholder")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </div>
      <div className="w-[180px]">
        <Select
          value={specialtyId ?? "all"}
          onValueChange={(v) => {
            onSpecialtyChange(v === "all" ? undefined : v);
          }}
        >
          <SelectTrigger data-testid="select-specialty-filter">
            <SelectValue placeholder={t("doctors.filterBySpecialty")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("doctors.allSpecialties")}</SelectItem>
            {specialties.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-[180px]">
        <Select
          value={isActive === undefined ? "all" : isActive ? "active" : "inactive"}
          onValueChange={(v) => {
            if (v === "all") onIsActiveChange(undefined);
            else if (v === "active") onIsActiveChange(true);
            else onIsActiveChange(false);
          }}
        >
          <SelectTrigger data-testid="select-status">
            <SelectValue placeholder={t("doctors.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("doctors.allStatuses")}</SelectItem>
            <SelectItem value="active">{t("doctors.active")}</SelectItem>
            <SelectItem value="inactive">{t("doctors.inactive")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
