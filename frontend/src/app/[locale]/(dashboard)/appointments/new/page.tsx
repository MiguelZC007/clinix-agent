"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  useCreateAppointment,
  useSpecialties,
} from "@/features/appointments/hooks/useAppointments";
import type { AppointmentFormData } from "@/features/appointments/schemas/appointment.schema";
import { AppointmentForm } from "@/features/appointments/ui/AppointmentForm";
import { useRouter } from "@/i18n/navigation";
import { FormPageTemplate } from "@/ui/templates/FormPageTemplate";

function toISOAppointment(dateStr: string, timeStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (!year || !month || !day || hours === undefined || minutes === undefined) {
    return "";
  }
  const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

export default function NewAppointmentPage() {
  const t = useTranslations();
  const router = useRouter();
  const { data: specialties, isLoading: isLoadingSpecialties } =
    useSpecialties();
  const { mutate: createAppointment, isLoading: isCreating } =
    useCreateAppointment();

  const specialtiesList = specialties ?? [];

  const handleSubmit = async (data: AppointmentFormData) => {
    const startAppointment = toISOAppointment(data.date, data.startTime);
    const endAppointment = toISOAppointment(data.date, data.endTime);
    if (!startAppointment || !endAppointment) {
      toast.error(t("appointments.invalidDateTime"));
      return;
    }
    try {
      await createAppointment({
        patientId: data.patientId,
        specialtyId: data.specialtyId,
        startAppointment,
        endAppointment,
        reason: data.reason,
      });
      toast.success(t("appointments.createSuccess"));
      router.push("/appointments");
    } catch (_err) {
      toast.error(t("appointments.createError"));
    }
  };

  const handleCancel = () => {
    router.push("/appointments");
  };

  const isLoading = isLoadingSpecialties;

  return (
    <FormPageTemplate
      title={t("appointments.newAppointment")}
      description={t("appointments.newAppointmentDescription")}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t("common.loading")}</div>
        </div>
      ) : (
        <AppointmentForm
          specialties={specialtiesList}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isCreating}
        />
      )}
    </FormPageTemplate>
  );
}
