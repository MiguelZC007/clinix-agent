"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getAppointmentsByPatient } from "@/features/appointments/api/appointments.api";
import type { Appointment } from "@/features/appointments/types/appointment.types";
import { PatientSearchSelect } from "@/features/patients/ui/PatientSearchSelect";
import { toDateLocale } from "@/lib/utils";
import { LoadingSpinner } from "@/ui/atoms/LoadingSpinner";
import { FormSection } from "@/ui/molecules/FormSection";
import {
  clinicalHistoryFormSchema,
  type ClinicalHistoryFormData,
} from "../schemas/clinical-history.schema";

type ClinicalHistoryFormProps = {
  onSubmit: (
    data: ClinicalHistoryFormData,
    appointmentId: string,
  ) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

function formatAppointmentLabel(a: Appointment, dateLocale: string): string {
  const d = a.date instanceof Date ? a.date : new Date(a.date);
  const dateStr = d.toLocaleDateString(dateLocale, { dateStyle: "short" });
  return `${dateStr} - ${a.reason || a.id}`;
}

export function ClinicalHistoryForm({
  onSubmit,
  onCancel,
  isLoading,
}: ClinicalHistoryFormProps) {
  const t = useTranslations();
  const dateLocale = toDateLocale(useLocale());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState(false);

  const form = useForm<ClinicalHistoryFormData>({
    resolver: zodResolver(clinicalHistoryFormSchema),
    defaultValues: {
      patientId: "",
      appointmentId: "",
      reason: "",
      symptoms: "",
      physicalExam: "",
      diagnosis: "",
      treatment: "",
      vitalSigns: {
        bloodPressure: "",
        heartRate: 0,
        temperature: 0,
        weight: 0,
        height: 0,
      },
    },
  });

  const patientId = form.watch("patientId");

  const loadAppointments = useCallback(
    async (pid: string) => {
      if (!pid) {
        setAppointments([]);
        form.setValue("appointmentId", "");
        setAppointmentsError(false);
        return;
      }
      setLoadingAppointments(true);
      setAppointmentsError(false);
      try {
        const list = await getAppointmentsByPatient(pid);
        setAppointments(list);
        form.setValue("appointmentId", "");
      } catch {
        setAppointments([]);
        form.setValue("appointmentId", "");
        setAppointmentsError(true);
      } finally {
        setLoadingAppointments(false);
      }
    },
    [form],
  );

  useEffect(() => {
    loadAppointments(patientId);
  }, [patientId, loadAppointments]);

  const handleSubmit = async (data: ClinicalHistoryFormData) => {
    await onSubmit(data, data.appointmentId);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormSection title={t("clinicalHistories.selectPatient")}>
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("appointments.patient")}</FormLabel>
                <FormControl>
                  <PatientSearchSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("clinicalHistories.searchPatient")}
                    disabled={isLoading}
                    displayEmail
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection title={t("clinicalHistories.selectAppointment")}>
          <FormField
            control={form.control}
            name="appointmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("clinicalHistories.selectAppointment")}
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={
                      !patientId ||
                      loadingAppointments ||
                      isLoading ||
                      appointmentsError
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingAppointments
                            ? t("common.loading")
                            : appointmentsError
                              ? t("common.error")
                              : !patientId
                                ? t("clinicalHistories.selectPatientFirst")
                                : appointments.length === 0
                                  ? t("common.noResults")
                                  : t("clinicalHistories.selectAppointment")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {appointments.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {formatAppointmentLabel(a, dateLocale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                {appointmentsError && (
                  <p className="text-sm text-destructive mt-1">
                    {t("clinicalHistories.loadAppointmentsError")}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection
          title={t("clinicalHistories.vitalSigns")}
          description={t("clinicalHistories.vitalSignsDescription")}
        >
          <div className="grid gap-4 md:grid-cols-5">
            <FormField
              control={form.control}
              name="vitalSigns.bloodPressure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clinicalHistories.bloodPressure")}</FormLabel>
                  <FormControl>
                    <Input placeholder="120/80 mmHg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vitalSigns.heartRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clinicalHistories.heartRate")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="72 bpm"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vitalSigns.temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clinicalHistories.temperature")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="36.5 °C"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vitalSigns.weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clinicalHistories.weight")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="70 kg"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vitalSigns.height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clinicalHistories.height")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="170 cm"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <FormSection
          title={t("clinicalHistories.consultationInfo")}
          description={t("clinicalHistories.consultationInfoDescription")}
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clinicalHistories.reason")}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clinicalHistories.symptoms")}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="physicalExam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clinicalHistories.physicalExam")}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clinicalHistories.diagnosis")}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="treatment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("clinicalHistories.treatment")}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
