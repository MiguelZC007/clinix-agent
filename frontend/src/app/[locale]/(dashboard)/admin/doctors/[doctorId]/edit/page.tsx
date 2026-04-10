"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getSpecialties } from "@/features/appointments/api/appointments.api";
import type { Specialty } from "@/features/appointments/types/appointment.types";
import { EditDoctorPageContent } from "./page.content";

type EditDoctorPageProps = {
  params: Promise<{ doctorId: string }>;
};

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
  }, [t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  return <EditDoctorPageContent doctorId={doctorId} specialties={specialties} />;
}
