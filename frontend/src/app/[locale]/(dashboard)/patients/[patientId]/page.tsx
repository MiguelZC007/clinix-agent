"use client";

import { use } from "react";
import { useEffect } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePatient } from "@/features/patients/hooks/usePatients";
import { PatientTabs } from "@/features/patients/ui/PatientTabs";
import { useRouter } from "@/i18n/navigation";
import { getSafeErrorMessage } from "@/lib/utils/error-handler";
import { ErrorState } from "@/ui/molecules/ErrorState";
import { PageHeader } from "@/ui/molecules/PageHeader";

type PatientDetailPageProps = {
  params: Promise<{ patientId: string }>;
};

export default function PatientDetailPage({ params }: PatientDetailPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const { patientId } = use(params);

  const { data: patient, isLoading, error } = usePatient(patientId);

  useEffect(() => {
    if (error && !isLoading) {
      const timer = setTimeout(() => {
        router.push("/patients");
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

  if (error || !patient) {
    return (
      <ErrorState
        title={t("patients.notFound")}
        description={
          error
            ? getSafeErrorMessage(error, t)
            : t("patients.notFoundDescription")
        }
        retryLabel={t("common.back")}
        onRetry={() => router.push("/patients")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${patient.name} ${patient.lastName}`}
        description={t("patients.patientDetails")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/patients")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>
            <Button onClick={() => router.push(`/patients/${patient.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t("common.edit")}
            </Button>
          </div>
        }
      />

      <PatientTabs patient={patient} />
    </div>
  );
}
