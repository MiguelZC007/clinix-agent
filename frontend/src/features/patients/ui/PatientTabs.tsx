"use client";

import { useState } from "react";
import {
  FileText,
  Calendar,
  Stethoscope,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ClinicalHistory } from "@/features/clinical-histories/types/clinical-history.types";
import { Link } from "@/i18n/navigation";
import { formatDateToYYYYMMDD, toDateLocale } from "@/lib/utils";
import { getSafeErrorMessage } from "@/lib/utils/error-handler";
import { DateRangeFilters } from "@/ui/molecules/DateRangeFilters";
import {
  usePatientAntecedents,
  usePatientClinicHistories,
  usePatientClinicHistoryFilterOptions,
} from "../hooks/usePatients";
import type { Patient } from "../types/patient.types";

const HISTORY_PAGE_SIZE = 10;

type PatientTabsProps = {
  patient: Patient;
};

function AntecedentsSection({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: string[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
      <ul className="list-disc list-inside space-y-1">
        {items.map((item, i) => (
          <li key={i} className="font-medium">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PatientHistoryCard({ history }: { history: ClinicalHistory }) {
  const t = useTranslations();
  const dateLocale = toDateLocale(useLocale());
  const doctorLabel =
    history.doctorName && history.doctorSpecialty
      ? `${history.doctorName} · ${history.doctorSpecialty}`
      : (history.doctorName ?? "—");

  return (
    <Link href={`/clinical-histories/${history.id}`}>
      <Card className="cursor-pointer transition-colors hover:bg-accent">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-2 shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="secondary" className="text-xs font-normal">
                  {history.doctorName ? (
                    <>
                      <Stethoscope className="mr-1 h-3 w-3" />
                      {t("patients.attendedBy")}: {doctorLabel}
                    </>
                  ) : (
                    "—"
                  )}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {history.createdAt
                    ? new Date(history.createdAt).toLocaleDateString(dateLocale)
                    : "—"}
                </div>
              </div>
              <p className="font-medium">{history.reason}</p>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {history.treatment || history.symptoms}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function PatientTabs({ patient }: PatientTabsProps) {
  const t = useTranslations();
  const [historyPage, setHistoryPage] = useState(1);
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");
  const [historyDoctorId, setHistoryDoctorId] = useState<string>("");
  const [historySpecialtyId, setHistorySpecialtyId] = useState<string>("");

  const {
    data: antecedents,
    isLoading: antecedentsLoading,
    error: antecedentsError,
  } = usePatientAntecedents(patient.id);
  const { data: filterOptions } = usePatientClinicHistoryFilterOptions(
    patient.id,
  );
  const {
    data: historiesData,
    isLoading: historiesLoading,
    error: historiesError,
  } = usePatientClinicHistories({
    patientId: patient.id,
    page: historyPage,
    pageSize: HISTORY_PAGE_SIZE,
    dateFrom: historyDateFrom || undefined,
    dateTo: historyDateTo || undefined,
    doctorId: historyDoctorId || undefined,
    specialtyId: historySpecialtyId || undefined,
  });

  const histories = historiesData?.items ?? [];
  const totalPages = historiesData?.totalPages ?? 0;
  const totalCount = historiesData?.total ?? 0;

  const hasHistoryFilters =
    historyDateFrom !== "" ||
    historyDateTo !== "" ||
    historyDoctorId !== "" ||
    historySpecialtyId !== "";

  const handleHistoryFilterChange = () => {
    setHistoryPage(1);
  };

  const handleClearHistoryFilters = () => {
    setHistoryDateFrom("");
    setHistoryDateTo("");
    setHistoryDoctorId("");
    setHistorySpecialtyId("");
    setHistoryPage(1);
  };

  const genderLabel: Record<"male" | "female" | "other", string> = {
    male: t("patients.male"),
    female: t("patients.female"),
    other: t("patients.other"),
  };

  const hasAnyAntecedents = antecedents
    ? antecedents.allergies.length > 0 ||
      antecedents.medications.length > 0 ||
      antecedents.medicalHistory.length > 0 ||
      antecedents.familyHistory.length > 0
    : false;

  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList>
        <TabsTrigger value="info">{t("patients.tabInfo")}</TabsTrigger>
        <TabsTrigger value="antecedents">
          {t("patients.tabAntecedents")}
        </TabsTrigger>
        <TabsTrigger value="history">{t("patients.tabHistory")}</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="mt-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("patients.personalInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {"patientNumber" in patient &&
                  patient.patientNumber != null && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t("patients.patientNumber")}
                      </p>
                      <p className="font-medium">{patient.patientNumber}</p>
                    </div>
                  )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("patients.name")}
                  </p>
                  <p className="font-medium">{patient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("patients.lastName")}
                  </p>
                  <p className="font-medium">{patient.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("patients.birthDate")}
                  </p>
                  <p className="font-medium">
                    {formatDateToYYYYMMDD(patient.birthDate) ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("patients.gender")}
                  </p>
                  <Badge variant="secondary">
                    {patient.gender ? genderLabel[patient.gender] : "—"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("patients.contactInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("patients.phone")}
                </p>
                <p className="font-medium">{patient.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("patients.email")}
                </p>
                <p className="font-medium">{patient.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("patients.address")}
                </p>
                <p className="font-medium">{patient.address ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="antecedents" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("patients.antecedents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {antecedentsLoading && (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}
            {antecedentsError && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-sm">
                  {getSafeErrorMessage(antecedentsError, t)}
                </p>
              </div>
            )}
            {!antecedentsLoading &&
              !antecedentsError &&
              antecedents &&
              !hasAnyAntecedents && (
                <p className="text-muted-foreground">
                  {t("patients.noAntecedents")}
                </p>
              )}
            {!antecedentsLoading &&
              !antecedentsError &&
              antecedents &&
              hasAnyAntecedents && (
                <div className="grid gap-6 md:grid-cols-2">
                  <AntecedentsSection
                    title={t("patients.allergies")}
                    items={antecedents.allergies}
                    emptyMessage="—"
                  />
                  <AntecedentsSection
                    title={t("patients.medications")}
                    items={antecedents.medications}
                    emptyMessage="—"
                  />
                  <AntecedentsSection
                    title={t("patients.medicalHistory")}
                    items={antecedents.medicalHistory}
                    emptyMessage="—"
                  />
                  <AntecedentsSection
                    title={t("patients.familyHistory")}
                    items={antecedents.familyHistory}
                    emptyMessage="—"
                  />
                </div>
              )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("patients.clinicalHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <DateRangeFilters
                dateFrom={historyDateFrom}
                dateTo={historyDateTo}
                onDateFromChange={(v) => {
                  setHistoryDateFrom(v);
                  handleHistoryFilterChange();
                }}
                onDateToChange={(v) => {
                  setHistoryDateTo(v);
                  handleHistoryFilterChange();
                }}
                dateFromLabel={t("clinicalHistories.dateFrom")}
                dateToLabel={t("clinicalHistories.dateTo")}
                calendarButtonLabel={t("common.openCalendar")}
                idPrefix="patient-history"
              />
              <div className="space-y-1">
                <label
                  className="text-xs text-muted-foreground"
                  htmlFor="patient-history-specialty"
                >
                  {t("appointments.specialty")}
                </label>
                <Select
                  value={historySpecialtyId || "all"}
                  onValueChange={(v) => {
                    setHistorySpecialtyId(v === "all" ? "" : v);
                    handleHistoryFilterChange();
                  }}
                >
                  <SelectTrigger
                    id="patient-history-specialty"
                    className="w-[180px]"
                  >
                    <SelectValue
                      placeholder={t("patients.filterAllSpecialties")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("patients.filterAllSpecialties")}
                    </SelectItem>
                    {filterOptions?.specialties?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label
                  className="text-xs text-muted-foreground"
                  htmlFor="patient-history-doctor"
                >
                  {t("patients.attendedBy")}
                </label>
                <Select
                  value={historyDoctorId || "all"}
                  onValueChange={(v) => {
                    setHistoryDoctorId(v === "all" ? "" : v);
                    handleHistoryFilterChange();
                  }}
                >
                  <SelectTrigger
                    id="patient-history-doctor"
                    className="w-[200px]"
                  >
                    <SelectValue placeholder={t("patients.filterAllDoctors")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("patients.filterAllDoctors")}
                    </SelectItem>
                    {filterOptions?.doctors?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} {d.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasHistoryFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearHistoryFilters}
                >
                  {t("clinicalHistories.clearFilters")}
                </Button>
              )}
            </div>

            {historiesLoading && (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            )}
            {historiesError && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p className="text-sm">
                  {getSafeErrorMessage(historiesError, t)}
                </p>
              </div>
            )}
            {!historiesLoading && !historiesError && histories.length === 0 && (
              <p className="text-muted-foreground">
                {t("patients.noClinicalHistories")}
              </p>
            )}
            {!historiesLoading && !historiesError && histories.length > 0 && (
              <>
                <div className="space-y-3">
                  {histories.map((h) => (
                    <PatientHistoryCard key={h.id} history={h} />
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {t("patients.page")} {historiesData?.page ?? 1}{" "}
                    {t("patients.pageOf")} {totalPages}
                    {totalCount > 0 &&
                      ` · ${totalCount} ${totalCount === 1 ? t("patients.record") : t("patients.records")}`}
                  </p>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={historyPage <= 1}
                        onClick={() =>
                          setHistoryPage((p) => Math.max(1, p - 1))
                        }
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {t("patients.previous")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={historyPage >= totalPages}
                        onClick={() =>
                          setHistoryPage((p) => Math.min(totalPages, p + 1))
                        }
                      >
                        {t("patients.next")}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
