"use client";

import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDoctor, useUpdateDoctor } from "@/features/admin/hooks/useDoctors";
import type { CreateDoctorFormData, UpdateDoctorFormData } from "@/features/admin/schemas/doctor.schema";
import type { UpdateDoctorRequest, UserRole } from "@/features/admin/types/doctor.types";
import { DoctorForm, type DoctorFormRef } from "@/features/admin/ui/DoctorForm";
import type { Specialty } from "@/features/appointments/types/appointment.types";
import { useRouter } from "@/i18n/navigation";
import { ConfirmDialog } from "@/ui/molecules/ConfirmDialog";

type DoctorFormSubmitData = (CreateDoctorFormData | UpdateDoctorFormData) & {
  roleChange?: { from: UserRole; to: UserRole };
};

type EditDoctorPageContentProps = {
  doctorId: string;
  specialties: Specialty[];
};

export function EditDoctorPageContent({
  doctorId,
  specialties,
}: EditDoctorPageContentProps) {
  const t = useTranslations();
  const router = useRouter();
  const { data: doctor, isLoading: isLoadingDoctor } = useDoctor(doctorId);
  const { mutate, isLoading } = useUpdateDoctor();

  // Pending role change awaiting confirmation
  const [pendingSubmit, setPendingSubmit] = useState<{
    payload: UpdateDoctorRequest;
    roleChange: { from: UserRole; to: UserRole };
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<DoctorFormRef>(null);

  const handleSubmit = async (data: DoctorFormSubmitData) => {
    const { roleChange, ...baseData } = data;

    if (roleChange) {
      // Role is changing — hold it and ask for confirmation
      const rolePayload: UpdateDoctorRequest = {
        ...(baseData as UpdateDoctorRequest),
        role: roleChange.to,
      };
      setPendingSubmit({ payload: rolePayload, roleChange });
      setConfirmOpen(true);
      return;
    }

    // No role change — submit directly
    try {
      await mutate(doctorId, baseData as UpdateDoctorRequest);
      toast.success(t("doctors.updateSuccess"));
      router.push("/admin/doctors");
    } catch (error) {
      console.error("Doctor update failed", { doctorId, error });
      toast.error(t("doctors.updateError"));
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!pendingSubmit) return;
    setConfirmOpen(false);
    try {
      await mutate(doctorId, pendingSubmit.payload);
      toast.success(t("doctors.updateSuccess"));
      router.push("/admin/doctors");
    } catch (error) {
      console.error("Doctor role update failed", { doctorId, error });
      toast.error(t("doctors.roleUpdateError"));
      formRef.current?.resetRole();
    } finally {
      setPendingSubmit(null);
    }
  };

  const handleCancelConfirm = () => {
    setConfirmOpen(false);
    setPendingSubmit(null);
  };

  if (isLoadingDoctor) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/doctors")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("doctors.editDoctor")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("doctors.doctorNotFound")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/admin/doctors/${doctorId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("doctors.editDoctor")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("doctors.doctorDetails")}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <DoctorForm
          ref={formRef}
          doctor={doctor}
          specialties={specialties}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/admin/doctors/${doctorId}`)}
          isLoading={isLoading}
          mode="edit"
        />
      </div>

      {pendingSubmit && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={(open) => {
            if (!open) handleCancelConfirm();
          }}
          title={t("doctors.roleConfirmTitle")}
          description={t("doctors.roleConfirmDescription", {
            from: t(`doctors.role${pendingSubmit.roleChange.from}`),
            to: t(`doctors.role${pendingSubmit.roleChange.to}`),
          })}
          confirmLabel={t("doctors.roleConfirmButton")}
          cancelLabel={t("common.cancel")}
          onConfirm={handleConfirmRoleChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
