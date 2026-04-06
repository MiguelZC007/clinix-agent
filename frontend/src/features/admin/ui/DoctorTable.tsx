"use client";

import { MoreHorizontal, Eye, Pencil, PowerOff, Power } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type Column } from "@/ui/organisms/DataTable";
import type { Doctor } from "../types/doctor.types";

type DoctorTableProps = {
  doctors: Doctor[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onView: (doctor: Doctor) => void;
  onEdit: (doctor: Doctor) => void;
  onActivate: (doctor: Doctor) => void;
  onDeactivate: (doctor: Doctor) => void;
};

export function DoctorTable({
  doctors,
  page,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onActivate,
  onDeactivate,
}: DoctorTableProps) {
  const t = useTranslations();

  const columns: Column<Doctor>[] = [
    {
      key: "fullName",
      headerKey: "doctors.fullName",
      render: (doctor) => `${doctor.name} ${doctor.lastName}`,
    },
    {
      key: "email",
      headerKey: "doctors.email",
    },
    {
      key: "specialtyName",
      headerKey: "doctors.specialty",
    },
    {
      key: "licenseNumber",
      headerKey: "doctors.licenseNumber",
    },
    {
      key: "isActive",
      headerKey: "doctors.status",
      render: (doctor) => (
        <Badge variant={doctor.isActive ? "default" : "secondary"}>
          {doctor.isActive ? t("doctors.active") : t("doctors.inactive")}
        </Badge>
      ),
    },
    {
      key: "actions",
      headerKey: "common.actions",
      className: "w-[100px]",
      render: (doctor) => (
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="group"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label={t("common.actions")}
                data-testid="btn-actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(doctor)} data-testid="btn-view">
                <Eye className="mr-2 h-4 w-4" />
                {t("common.view")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(doctor)} data-testid="btn-edit">
                <Pencil className="mr-2 h-4 w-4" />
                {t("common.edit")}
              </DropdownMenuItem>
              {doctor.isActive ? (
                <DropdownMenuItem onClick={() => onDeactivate(doctor)} data-testid="btn-deactivate">
                  <PowerOff className="mr-2 h-4 w-4" />
                  {t("doctors.deactivate")}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onActivate(doctor)} data-testid="btn-activate">
                  <Power className="mr-2 h-4 w-4" />
                  {t("doctors.activate")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={doctors}
      columns={columns}
      keyExtractor={(doctor) => doctor.id}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onRowClick={onView}
    />
  );
}
