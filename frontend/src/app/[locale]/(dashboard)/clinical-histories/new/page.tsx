"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { mapFormDataToBackendPayload } from "@/features/clinical-histories/api/mapFormDataToBackendPayload";
import { useCreateClinicalHistory } from "@/features/clinical-histories/hooks/useClinicalHistories";
import type { ClinicalHistoryFormData } from "@/features/clinical-histories/schemas/clinical-history.schema";
import { ClinicalHistoryForm } from "@/features/clinical-histories/ui/ClinicalHistoryForm";
import { useRouter } from "@/i18n/navigation";
import { AppError } from "@/lib/api/errors";
import { FormPageTemplate } from "@/ui/templates/FormPageTemplate";

export default function NewClinicalHistoryPage() {
  const t = useTranslations();
  const router = useRouter();

  const { mutate: createClinicalHistory, isLoading: isCreating } =
    useCreateClinicalHistory();

  const handleSubmit = async (data: ClinicalHistoryFormData, appointmentId: string) => {
    try {
      const payload = mapFormDataToBackendPayload(data, appointmentId);
      await createClinicalHistory(payload);
      toast.success(t("clinicalHistories.createSuccess"));
      router.push("/clinical-histories");
    } catch (error) {
      if (error instanceof AppError && error.status === 409) {
        toast.error(t("clinicalHistories.appointmentAlreadyHasHistory"));
        return;
      }
      if (error instanceof AppError && error.status === 404) {
        toast.error(t("clinicalHistories.appointmentNotFound"));
        return;
      }
      toast.error(t("clinicalHistories.createError"));
    }
  };

  const handleCancel = () => {
    router.push("/clinical-histories");
  };

  return (
    <FormPageTemplate title={t("clinicalHistories.newHistory")}>
      <ClinicalHistoryForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isCreating}
      />
    </FormPageTemplate>
  );
}
