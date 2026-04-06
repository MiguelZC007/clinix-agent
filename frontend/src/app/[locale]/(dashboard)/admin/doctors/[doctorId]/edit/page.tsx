"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSpecialties } from "@/features/appointments/api/appointments.api";
import type { Specialty } from "@/features/appointments/types/appointment.types";
import { useDoctor, useUpdateDoctor } from "@/features/admin/hooks/useDoctors";
import { DoctorForm } from "@/features/admin/ui/DoctorForm";
import type { CreateDoctorFormData, UpdateDoctorFormData } from "@/features/admin/schemas/doctor.schema";
import type { UpdateDoctorRequest } from "@/features/admin/types/doctor.types";

type EditDoctorPageProps = {
  params: Promise<{ doctorId: string }>;
};

function EditDoctorPageContent({ doctorId, specialties }: { doctorId: string; specialties: Specialty[] }) {
  const t = useTranslations();
  const router = useRouter();
  const { data: doctor, isLoading: isLoadingDoctor } = useDoctor(doctorId);
  const { mutate, isLoading } = useUpdateDoctor();

  const handleSubmit = async (data: CreateDoctorFormData | UpdateDoctorFormData) => {
    try {
      await mutate(doctorId, data as UpdateDoctorRequest);
      toast.success(t("doctors.updateSuccess"));
      router.push("/admin/doctors");
    } catch (_error) {
      toast.error(t("doctors.updateError"));
    }
  };

  if (isLoadingDoctor) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  if (!doctor) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/doctors/${doctorId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("doctors.editDoctor")}</h1>
          <p className="text-sm text-muted-foreground">{t("doctors.doctorDetails")}</p>
        </div>
      </div>
      <div className="bg-card rounded-lg border p-6">
        <DoctorForm
          doctor={doctor}
          specialties={specialties}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/admin/doctors/${doctorId}`)}
          isLoading={isLoading}
          mode="edit"
        />
      </div>
    </div>
  );
}

export default function EditDoctorPage({ params }: EditDoctorPageProps) {
  const t = useTranslations();
  const { doctorId } = use(params);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSpecialties()
      .then(setSpecialties)
      .catch(() => {
        setSpecialties([]);
        toast.error(t("doctors.specialtiesLoadError"));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <EditDoctorPageContent doctorId={doctorId} specialties={specialties} />;
}
