"use client";

import { Eye } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { toDateLocale } from "@/lib/utils";
import { DataTable, type Column } from "@/ui/organisms/DataTable";
import type { ClinicalHistory } from "../types/clinical-history.types";

const MAX_TEXT_LENGTH = 50;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

function formatDate(isoDate: string, locale: string): string {
  return new Date(isoDate).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type ClinicalHistoryTableProps = {
  histories: ClinicalHistory[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onView: (history: ClinicalHistory) => void;
};

export function ClinicalHistoryTable({
  histories,
  page,
  totalPages,
  onPageChange,
  onView,
}: ClinicalHistoryTableProps) {
  const t = useTranslations();
  const dateLocale = toDateLocale(useLocale());

  const columns: Column<ClinicalHistory & Record<string, unknown>>[] = [
    {
      key: "patientName",
      headerKey: "patients.fullName",
      render: (item) => item.patientName ?? "—",
    },
    {
      key: "createdAt",
      headerKey: "common.date",
      render: (item) => formatDate(item.createdAt, dateLocale),
    },
    {
      key: "reason",
      headerKey: "clinicalHistories.reason",
      render: (item) => truncate(item.reason, MAX_TEXT_LENGTH),
    },
    {
      key: "diagnosis",
      headerKey: "clinicalHistories.diagnosis",
      render: (item) => truncate(item.diagnosis, MAX_TEXT_LENGTH),
    },
    {
      key: "actions",
      headerKey: "common.actions",
      className: "w-[80px]",
      render: (item) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={(e) => {
            e.stopPropagation();
            onView(item);
          }}
        >
          <Eye className="mr-2 h-4 w-4" />
          {t("common.view")}
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      data={histories as (ClinicalHistory & Record<string, unknown>)[]}
      columns={columns}
      keyExtractor={(item) => item.id}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      onRowClick={onView}
    />
  );
}
