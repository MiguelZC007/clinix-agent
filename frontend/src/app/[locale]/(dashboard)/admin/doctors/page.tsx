"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useDoctorList,
  useDeactivateDoctor,
  useActivateDoctor,
} from "@/features/admin/hooks/useDoctors";
import type { Doctor } from "@/features/admin/types/doctor.types";
import { DoctorFilters } from "@/features/admin/ui/DoctorFilters";
import { DoctorTable } from "@/features/admin/ui/DoctorTable";
import { useSpecialties } from "@/features/appointments/hooks/useAppointments";
import { useRouter } from "@/i18n/navigation";
import { getSafeErrorMessage } from "@/lib/utils/error-handler";
import { ConfirmDialog } from "@/ui/molecules/ConfirmDialog";
import { EmptyState } from "@/ui/molecules/EmptyState";
import { ErrorState } from "@/ui/molecules/ErrorState";
import { TableSkeleton } from "@/ui/molecules/TableSkeleton";
import { ListPageTemplate } from "@/ui/templates/ListPageTemplate";

export default function DoctorsPage() {
  const t = useTranslations();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [specialtyId, setSpecialtyId] = useState<string | undefined>(undefined);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [dialogAction, setDialogAction] = useState<"activate" | "deactivate" | null>(null);

  const { data: specialties } = useSpecialties();

  const { data, isLoading, error, refetch } = useDoctorList({
    search,
    page,
    pageSize: 10,
    isActive,
    specialtyId,
  });

  const { mutate: deactivateMutation, isLoading: isDeactivating } = useDeactivateDoctor();
  const { mutate: activateMutation, isLoading: isActivating } = useActivateDoctor();

  const doctors = data?.items || [];
  const totalPages = data?.totalPages || 0;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleIsActiveChange = (value: boolean | undefined) => {
    setIsActive(value);
    setPage(1);
  };

  const handleSpecialtyChange = (value: string | undefined) => {
    setSpecialtyId(value);
    setPage(1);
  };

  const handleView = (doctor: Doctor) => {
    router.push(`/admin/doctors/${doctor.id}`);
  };

  const handleEdit = (doctor: Doctor) => {
    router.push(`/admin/doctors/${doctor.id}/edit`);
  };

  const handleDeactivate = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDialogAction("deactivate");
  };

  const handleActivate = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDialogAction("activate");
  };

  const handleConfirmAction = async () => {
    if (!selectedDoctor) return;

    try {
      if (dialogAction === "deactivate") {
        await deactivateMutation(selectedDoctor.id);
        toast.success(t("doctors.deactivateSuccess"));
      } else if (dialogAction === "activate") {
        await activateMutation(selectedDoctor.id);
        toast.success(t("doctors.activateSuccess"));
      }
      setSelectedDoctor(null);
      setDialogAction(null);
      refetch();
    } catch (_error) {
      toast.error(
        dialogAction === "deactivate"
          ? t("doctors.deactivateError")
          : t("doctors.activateError")
      );
    }
  };

  const isProcessing = isDeactivating || isActivating;

  return (
    <>
      <ListPageTemplate
        title={t("doctors.title")}
        description={t("doctors.description")}
        actions={
          <Button onClick={() => router.push("/admin/doctors/new")}>
            <Plus className="mr-2 h-4 w-4" />
            {t("doctors.newDoctor")}
          </Button>
        }
        filters={
          <DoctorFilters
            search={search}
            onSearchChange={handleSearchChange}
            isActive={isActive}
            onIsActiveChange={handleIsActiveChange}
            specialtyId={specialtyId}
            onSpecialtyChange={handleSpecialtyChange}
            specialties={specialties ?? []}
          />
        }
      >
        {isLoading ? (
          <TableSkeleton columns={5} rows={10} />
        ) : error ? (
          <ErrorState
            title={t("common.error")}
            description={getSafeErrorMessage(error, t)}
            retryLabel={t("common.retry")}
            onRetry={refetch}
          />
        ) : doctors.length === 0 ? (
          <EmptyState
            type="doctors"
            title={t("doctors.emptyTitle")}
            description={t("doctors.emptyDescription")}
            actionLabel={t("doctors.newDoctor")}
            onAction={() => router.push("/admin/doctors/new")}
          />
        ) : (
          <DoctorTable
            doctors={doctors}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onView={handleView}
            onEdit={handleEdit}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
          />
        )}
      </ListPageTemplate>

      <ConfirmDialog
        open={!!selectedDoctor && dialogAction === "deactivate"}
        onOpenChange={(open) => !open && setSelectedDoctor(null)}
        title={t("doctors.deleteConfirmTitle")}
        description={t("doctors.deleteConfirmDescription")}
        confirmLabel={t("doctors.deactivate")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleConfirmAction}
        variant="destructive"
        isLoading={isProcessing}
      />

      <ConfirmDialog
        open={!!selectedDoctor && dialogAction === "activate"}
        onOpenChange={(open) => !open && setSelectedDoctor(null)}
        title={t("doctors.activateConfirmTitle")}
        description={t("doctors.activateConfirmDescription")}
        confirmLabel={t("doctors.activate")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleConfirmAction}
        isLoading={isProcessing}
      />
    </>
  );
}
