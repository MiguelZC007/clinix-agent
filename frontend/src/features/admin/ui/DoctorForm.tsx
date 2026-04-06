"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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
import { LoadingSpinner } from "@/ui/atoms/LoadingSpinner";
import { FormSection } from "@/ui/molecules/FormSection";
import { createDoctorFormSchema, updateDoctorFormSchema } from "../schemas/doctor.schema";
import type { CreateDoctorFormData, UpdateDoctorFormData } from "../schemas/doctor.schema";
import type { Specialty } from "@/features/appointments/types/appointment.types";

type DoctorFormProps = {
  doctor?: {
    id: string;
    name: string;
    lastName: string;
    email?: string;
    phone?: string;
    specialtyId: string;
    licenseNumber: string;
  };
  specialties: Specialty[];
  onSubmit: (data: CreateDoctorFormData | UpdateDoctorFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode: "create" | "edit";
};

export function DoctorForm({
  doctor,
  specialties,
  onSubmit,
  onCancel,
  isLoading,
  mode,
}: DoctorFormProps) {
  const t = useTranslations();

  const formSchema = mode === "create"
    ? createDoctorFormSchema
    : updateDoctorFormSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: doctor?.name ?? "",
      lastName: doctor?.lastName ?? "",
      specialtyId: doctor?.specialtyId ?? "",
      licenseNumber: doctor?.licenseNumber ?? "",
      password: mode === "create" ? "" : undefined,
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8" data-testid="doctor-form">
        <FormSection
          title={t("doctors.personalInfo")}
          description={t("doctors.personalInfoDescription")}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("doctors.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="given-name" data-testid="input-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("doctors.lastName")}</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="family-name" data-testid="input-lastName" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("doctors.licenseNumber")}</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-licenseNumber" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialtyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("doctors.specialty")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-specialty">
                        <SelectValue placeholder={t("doctors.selectSpecialty")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {specialties.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <FormSection
          title={t("doctors.contactInfo")}
          description={t("doctors.contactInfoDescription")}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {t("doctors.email")}
              </p>
              <p className="font-medium">{doctor?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {t("doctors.phone")}
              </p>
              <p className="font-medium">{doctor?.phone ?? "—"}</p>
            </div>
          </div>
        </FormSection>

        {mode === "create" && (
          <FormSection
            title={t("doctors.securityInfo")}
            description={t("doctors.securityInfoDescription")}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("doctors.password")}</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} data-testid="input-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            data-testid="btn-cancel"
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading} data-testid="btn-submit">
            {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
