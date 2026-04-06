"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAppointmentList } from "@/features/appointments/hooks/useAppointments";
import type {
  Appointment,
  AppointmentStatus,
} from "@/features/appointments/types/appointment.types";
import { AppointmentCalendar } from "@/features/appointments/ui/AppointmentCalendar";
import { useRouter } from "@/i18n/navigation";
import { toDateLocale } from "@/lib/utils";
import { getSafeErrorMessage } from "@/lib/utils/error-handler";
import { StatusBadge } from "@/ui/atoms/StatusBadge";
import { ErrorState } from "@/ui/molecules/ErrorState";
import { PageHeader } from "@/ui/molecules/PageHeader";

const STATUS_VARIANT: Record<
  AppointmentStatus,
  "default" | "success" | "warning" | "error"
> = {
  scheduled: "default",
  completed: "success",
  cancelled: "error",
  pending: "warning",
  confirmed: "default",
};

function getStatusLabel(
  status: AppointmentStatus,
  t: ReturnType<typeof useTranslations>,
): string {
  const labels: Record<AppointmentStatus, string> = {
    scheduled: t("appointments.scheduled"),
    completed: t("appointments.completed"),
    cancelled: t("appointments.cancelled"),
    pending: t("appointments.pending"),
    confirmed: t("appointments.confirmed"),
  };
  return labels[status];
}

function getCurrentWeekRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const startDate = new Date(now);
  const day = startDate.getDay();
  const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
  startDate.setDate(diff);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

const STATUS_FILTER_OPTIONS: (AppointmentStatus | "all")[] = [
  "all",
  "scheduled",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

export default function AppointmentsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const dateLocale = toDateLocale(locale);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>(getCurrentWeekRange);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | null>(
    null,
  );

  const handleDateRangeChange = useCallback(
    (startDate: string, endDate: string) => {
      setDateRange((prev) => {
        if (prev.startDate === startDate && prev.endDate === endDate) {
          return prev;
        }
        return { startDate, endDate };
      });
    },
    [],
  );

  const { data, isLoading, error } = useAppointmentList({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    limit: 100,
    ...(statusFilter ? { status: statusFilter } : {}),
  });
  const appointments = data?.items || [];

  return (
    <div className="space-y-4 h-full">
      <PageHeader
        title={t("appointments.title")}
        description={t("appointments.description")}
        actions={
          <Button onClick={() => router.push("/appointments/new")}>
            <Plus className="mr-2 h-4 w-4" />
            {t("appointments.newAppointment")}
          </Button>
        }
      />

      {isLoading && !data ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t("common.loading")}</div>
        </div>
      ) : error ? (
        <ErrorState
          title={t("common.error")}
          description={getSafeErrorMessage(error, t)}
          retryLabel={t("common.retry")}
          onRetry={() => window.location.reload()}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTER_OPTIONS.map((option) => {
              const value = option === "all" ? null : option;
              const isActive = statusFilter === value;
              const label =
                option === "all"
                  ? t("appointments.filterAll")
                  : t(`appointments.${option}`);
              return (
                <Button
                  key={option}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  aria-pressed={isActive}
                  onClick={() => setStatusFilter(value)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
          <AppointmentCalendar
            appointments={appointments}
            onAppointmentClick={setSelectedAppointment}
            onDateRangeChange={handleDateRangeChange}
          />
        </>
      )}

      <Dialog
        open={!!selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
      >
        <DialogContent closeLabel={t("common.close")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {selectedAppointment?.patientInitials}
              </div>
              {selectedAppointment?.patientName}
            </DialogTitle>
            <DialogDescription>
              {t("appointments.appointmentDetails")}
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("appointments.date")}
                  </p>
                  <p className="font-medium">
                    {selectedAppointment.date.toLocaleDateString(dateLocale, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("appointments.time")}
                  </p>
                  <p className="font-medium">
                    {selectedAppointment.startTime} -{" "}
                    {selectedAppointment.endTime}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("appointments.reason")}
                </p>
                <p className="font-medium">{selectedAppointment.reason}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("appointments.status")}
                </p>
                <StatusBadge
                  status={getStatusLabel(selectedAppointment.status, t)}
                  variant={STATUS_VARIANT[selectedAppointment.status]}
                />
              </div>
              <div className="flex gap-2 pt-4">
                {selectedAppointment.status === "scheduled" && (
                  <p className="flex-1 text-sm text-muted-foreground italic">
                    {t("common.comingSoon")}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
