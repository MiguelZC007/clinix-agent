"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCreateDoctor } from "@/features/admin/hooks/useDoctors";
import type { CreateDoctorFormData, UpdateDoctorFormData } from "@/features/admin/schemas/doctor.schema";
import type { CreateDoctorRequest } from "@/features/admin/types/doctor.types";
import { DoctorForm } from "@/features/admin/ui/DoctorForm";
import { getSpecialties } from "@/features/appointments/api/appointments.api";
import type { Specialty } from "@/features/appointments/types/appointment.types";
import { useRouter } from "@/i18n/navigation";

type NewDoctorPageProps = {
  specialties: Specialty[];
};

function NewDoctorPageContent({ specialties }: NewDoctorPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const { mutate, isLoading } = useCreateDoctor();

  const handleSubmit = async (data: CreateDoctorFormData | UpdateDoctorFormData) => {
    try {
      await mutate(data as CreateDoctorRequest);
      toast.success(t("doctors.createSuccess"));
      router.push("/admin/doctors");
    } catch (_error) {
      toast.error(t("doctors.createError"));
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/doctors")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("doctors.newDoctor")}</h1>
          <p className="text-sm text-muted-foreground">{t("doctors.description")}</p>
        </div>
      </div>
      <div className="bg-card rounded-lg border p-6">
        <DoctorForm
          specialties={specialties}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/admin/doctors")}
          isLoading={isLoading}
          mode="create"
        />
      </div>
    </div>
  );
}

export default function NewDoctorPage() {
  const t = useTranslations();
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
  }, [t]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <NewDoctorPageContent specialties={specialties} />;
}
