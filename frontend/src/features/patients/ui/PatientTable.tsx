"use client";

import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type Column } from "@/ui/organisms/DataTable";
import type { Patient } from "../types/patient.types";

type PatientTableProps = {
  patients: Patient[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onView: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
};

export function PatientTable({
  patients,
  page,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: PatientTableProps) {
  const t = useTranslations();

  const columns: Column<Patient>[] = [
    {
      key: "fullName",
      headerKey: "patients.fullName",
      render: (patient) => `${patient.name} ${patient.lastName}`,
    },
    {
      key: "phone",
      headerKey: "patients.phone",
    },
    {
      key: "email",
      headerKey: "patients.email",
    },
    {
      key: "actions",
      headerKey: "common.actions",
      className: "w-[80px]",
      render: (patient) => (
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
              <DropdownMenuItem onClick={() => onView(patient)} data-testid="btn-view">
                <Eye className="mr-2 h-4 w-4" />
                {t("common.view")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(patient)} data-testid="btn-edit">
                <Pencil className="mr-2 h-4 w-4" />
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(patient)}
                className="text-destructive"
                data-testid="btn-delete"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("common.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={patients}
      columns={columns}
      keyExtractor={(patient) => patient.id}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onRowClick={onView}
    />
  );
}
