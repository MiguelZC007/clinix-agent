"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  usePatient,
  useUpdatePatient,
} from "@/features/patients/hooks/usePatients";
import type { PatientFormData } from "@/features/patients/schemas/patient.schema";
import { PatientForm } from "@/features/patients/ui/PatientForm";
import { useRouter } from "@/i18n/navigation";
import { getSafeErrorMessage } from "@/lib/utils/error-handler";
import { ErrorState } from "@/ui/molecules/ErrorState";
import { FormPageTemplate } from "@/ui/templates/FormPageTemplate";

type EditPatientPageProps = {
  params: Promise<{ patientId: string }>;
};

export default function EditPatientPage({ params }: EditPatientPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const { patientId } = use(params);

  const {
    data: patient,
    isLoading: isLoadingPatient,
    error,
  } = usePatient(patientId);
  const { mutate: updatePatient, isLoading: isUpdating } = useUpdatePatient();

  const handleSubmit = async (data: PatientFormData) => {
    if (!patient) return;

    try {
      await updatePatient(patientId, data);
      toast.success(t("patients.updateSuccess"));
      router.push(`/patients/${patientId}`);
    } catch (_error) {
      toast.error(t("patients.updateError"));
    }
  };

  const handleCancel = () => {
    router.push(`/patients/${patientId}`);
  };

  if (isLoadingPatient) {
    return (
      <FormPageTemplate title={t("patients.editPatient")}>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t("common.loading")}</div>
        </div>
      </FormPageTemplate>
    );
  }

  if (error || !patient) {
    return (
      <FormPageTemplate title={t("patients.editPatient")}>
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
      </FormPageTemplate>
    );
  }

  return (
    <FormPageTemplate
      title={t("patients.editPatient")}
      description={`${patient.name} ${patient.lastName}`}
    >
      <PatientForm
        patient={patient}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isUpdating}
      />
    </FormPageTemplate>
  );
}
