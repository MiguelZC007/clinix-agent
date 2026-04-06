"use client";

import { FileText, Calendar } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { toDateLocale } from "@/lib/utils";
import type { ClinicalHistory } from "../types/clinical-history.types";

type ClinicalHistoryCardProps = {
  history: ClinicalHistory;
  onClick?: () => void;
};

export function ClinicalHistoryCard({
  history,
  onClick,
}: ClinicalHistoryCardProps) {
  const t = useTranslations();
  const dateLocale = toDateLocale(useLocale());

  return (
    <Card
      className={
        onClick
          ? "cursor-pointer transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          : ""
      }
      onClick={onClick}
      {...(onClick
        ? {
            role: "button" as const,
            tabIndex: 0,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            },
          }
        : {})}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{history.patientName}</h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(history.createdAt).toLocaleDateString(dateLocale)}
              </div>
            </div>
            <p className="text-sm font-medium text-primary">
              {t("clinicalHistories.diagnosis")}: {history.diagnosis}
            </p>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {history.reason}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
