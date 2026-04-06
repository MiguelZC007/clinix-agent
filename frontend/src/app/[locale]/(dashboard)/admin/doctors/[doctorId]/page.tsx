"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowLeft, Pencil, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoctor, useDoctorAuditLogs } from "@/features/admin/hooks/useDoctors";
import type { AuditLog } from "@/features/admin/api/audit-logs.api";
import { useRouter } from "@/i18n/navigation";
import { getSafeErrorMessage } from "@/lib/utils/error-handler";
import { toDateLocale } from "@/lib/utils";
import { ErrorState } from "@/ui/molecules/ErrorState";
import { PageHeader } from "@/ui/molecules/PageHeader";

type DoctorDetailPageProps = {
  params: Promise<{ doctorId: string }>;
};

const AUDIT_PAGE_SIZE = 10;

function AuditLogCard({ log }: { log: AuditLog }) {
  const t = useTranslations();
  const dateLocale = toDateLocale(useLocale());

  const actionColors: Record<string, string> = {
    CREATE: "bg-green-100 text-green-800",
    UPDATE: "bg-blue-100 text-blue-800",
    DELETE: "bg-red-100 text-red-800",
    ACTIVATE: "bg-green-100 text-green-800",
    DEACTIVATE: "bg-orange-100 text-orange-800",
  };

  const colorClass = actionColors[log.action] || "bg-gray-100 text-gray-800";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge className={`text-xs font-normal ${colorClass}`}>
                {log.action}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {log.createdAt
                  ? new Date(log.createdAt).toLocaleDateString(dateLocale)
                  : "—"}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {log.userName || log.userEmail || "Sistema"}
            </p>
            {log.previousState && log.newState && (
              <div className="text-xs text-muted-foreground mt-2">
                <details className="cursor-pointer">
                  <summary className="font-medium">{t("audit.viewChanges")}</summary>
                  <div className="mt-2 p-2 bg-muted rounded text-xs font-mono overflow-x-auto">
                    <div className="text-red-500">- {JSON.stringify(log.previousState)}</div>
                    <div className="text-green-500">+ {JSON.stringify(log.newState)}</div>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DoctorDetailPage({ params }: DoctorDetailPageProps) {
  const t = useTranslations();
  const router = useRouter();
  const { doctorId } = use(params);
  const [auditPage, setAuditPage] = useState(1);

  const { data: doctor, isLoading, error } = useDoctor(doctorId);
  const {
    data: auditData,
    isLoading: auditLoading,
    error: auditError,
  } = useDoctorAuditLogs(doctorId, auditPage, AUDIT_PAGE_SIZE);

  useEffect(() => {
    if (error && !isLoading) {
      const timer = setTimeout(() => {
        router.push("/admin/doctors");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <ErrorState
        title={t("doctors.notFound")}
        description={
          error
            ? getSafeErrorMessage(error, t)
            : t("doctors.notFoundDescription")
        }
        retryLabel={t("common.back")}
        onRetry={() => router.push("/admin/doctors")}
      />
    );
  }

  const auditLogs = auditData?.items ?? [];
  const totalAuditPages = auditData?.totalPages ?? 0;
  const totalAuditCount = auditData?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${doctor.name} ${doctor.lastName}`}
        description={t("doctors.doctorDetails")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/doctors")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>
            <Button onClick={() => router.push(`/admin/doctors/${doctor.id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t("common.edit")}
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">{t("patients.tabInfo")}</TabsTrigger>
          <TabsTrigger value="audit">{t("audit.title")}</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("doctors.personalInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("doctors.name")}
                    </p>
                    <p className="font-medium">{doctor.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("doctors.lastName")}
                    </p>
                    <p className="font-medium">{doctor.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("doctors.specialty")}
                    </p>
                    <p className="font-medium">{doctor.specialtyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("doctors.licenseNumber")}
                    </p>
                    <p className="font-medium">{doctor.licenseNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t("doctors.status")}
                    </p>
                    <Badge variant={doctor.isActive ? "default" : "secondary"}>
                      {doctor.isActive ? t("doctors.active") : t("doctors.inactive")}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("doctors.contactInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("doctors.email")}
                  </p>
                  <p className="font-medium">{doctor.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("doctors.phone")}
                  </p>
                  <p className="font-medium">{doctor.phone}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("audit.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {auditLoading && (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              )}
              {auditError && (
                <div className="text-destructive text-sm">
                  {getSafeErrorMessage(auditError, t)}
                </div>
              )}
              {!auditLoading && !auditError && auditLogs.length === 0 && (
                <p className="text-muted-foreground">{t("audit.noLogs")}</p>
              )}
              {!auditLoading && !auditError && auditLogs.length > 0 && (
                <>
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <AuditLogCard key={log.id} log={log} />
                    ))}
                  </div>
                  {totalAuditPages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {t("patients.page")} {auditData?.page ?? 1}{" "}
                        {t("patients.pageOf")} {totalAuditPages}
                        {totalAuditCount > 0 &&
                          ` · ${totalAuditCount} ${totalAuditCount === 1 ? t("patients.record") : t("patients.records")}`}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={auditPage <= 1}
                          onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          {t("patients.previous")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={auditPage >= totalAuditPages}
                          onClick={() => setAuditPage((p) => Math.min(totalAuditPages, p + 1))}
                        >
                          {t("patients.next")}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
