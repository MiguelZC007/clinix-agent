"use client";

import { use } from "react";
import { useEffect } from "react";
import { ArrowLeft, User } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClinicalHistory } from "@/features/clinical-histories/hooks/useClinicalHistories";
import { ClinicalHistoryDetail } from "@/features/clinical-histories/ui/ClinicalHistoryDetail";
import { useRouter } from "@/i18n/navigation";
import { toDateLocale } from "@/lib/utils";
import { getSafeErrorMessage } from "@/lib/utils/error-handler";
import { ErrorState } from "@/ui/molecules/ErrorState";
import { PageHeader } from "@/ui/molecules/PageHeader";

type ClinicalHistoryDetailPageProps = {
  params: Promise<{ historyId: string }>;
};

export default function ClinicalHistoryDetailPage({
  params,
}: ClinicalHistoryDetailPageProps) {
  const t = useTranslations();
  const dateLocale = toDateLocale(useLocale());
  const router = useRouter();
  const { historyId } = use(params);

  const { data: history, isLoading, error } = useClinicalHistory(historyId);

  useEffect(() => {
    if (error && !isLoading) {
      const timer = setTimeout(() => {
        router.push("/clinical-histories");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  if (error || !history) {
    return (
      <ErrorState
        title={t("clinicalHistories.notFound")}
        description={
          error
            ? getSafeErrorMessage(error, t)
            : t("clinicalHistories.notFoundDescription")
        }
        retryLabel={t("common.back")}
        onRetry={() => router.push("/clinical-histories")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("clinicalHistories.historyDetails")}
        description={
          <div className="flex items-center gap-2 mt-1">
            <User className="h-4 w-4" />
            <span>{history.patientName || t("patients.patientDetails")}</span>
            <Badge variant="secondary">
              {new Date(history.createdAt).toLocaleDateString(dateLocale)}
            </Badge>
          </div>
        }
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/clinical-histories")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/patients/${history.patientId}`)}
            >
              <User className="mr-2 h-4 w-4" />
              {t("patients.patientDetails")}
            </Button>
          </div>
        }
      />

      <ClinicalHistoryDetail history={history} />
    </div>
  );
}
