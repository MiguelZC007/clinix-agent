"use client";

import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useDashboardSummary } from "@/features/dashboard/hooks/useDashboardSummary";
import type { RecentConsultation } from "@/features/dashboard/types/dashboard.types";
import { useRouter } from "@/i18n/navigation";
import { toDateLocale } from "@/lib/utils";
import { LoadingSpinner } from "@/ui/atoms/LoadingSpinner";
import { EmptyState } from "@/ui/molecules/EmptyState";
import { ErrorState } from "@/ui/molecules/ErrorState";
import { PageHeader } from "@/ui/molecules/PageHeader";

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
};

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

type QuickActionProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
};

function QuickAction({ title, description, icon, onClick }: QuickActionProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

function formatConsultationDate(
  isoDate: string,
  todayKey: string,
  yesterdayKey: string,
  dateLocale: string,
): string {
  const d = new Date(isoDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (dateOnly.getTime() === today.getTime()) return todayKey;
  if (dateOnly.getTime() === yesterday.getTime()) return yesterdayKey;
  return d.toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string, lastName: string): string {
  const n = name?.trim().charAt(0) ?? "";
  const l = lastName?.trim().charAt(0) ?? "";
  return (n + l).toUpperCase() || "?";
}

export default function DashboardPage() {
  const t = useTranslations();
  const dateLocale = toDateLocale(useLocale());
  const router = useRouter();
  const { data: session } = useSession();
  const { data: summary, isLoading, error, refetch } = useDashboardSummary();
  const displayName =
    session?.user?.name && session?.user?.lastName
      ? `${session.user.name} ${session.user.lastName}`.trim()
      : (session?.user?.name ?? null);
  const welcomeText = displayName
    ? t("dashboard.welcomeUser", { name: displayName })
    : t("dashboard.welcome");

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-lg font-medium text-foreground">{welcomeText}</p>
          </CardContent>
        </Card>
        <ErrorState
          title={t("common.error")}
          description={t("common.retry")}
          retryLabel={t("common.retry")}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <p className="text-lg font-medium text-foreground">{welcomeText}</p>
        </CardContent>
      </Card>
      <PageHeader
        title={t("navigation.dashboard")}
        description={t("common.appName")}
        actions={
          <Button onClick={() => router.push("/patients/new")}>
            <Plus className="mr-2 h-4 w-4" />
            {t("patients.newPatient")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("navigation.patients")}
              value={String(summary.patientsCount)}
              description={t("dashboard.registeredPatients")}
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              title={t("navigation.appointments")}
              value={String(summary.appointmentsThisWeek)}
              description={t("dashboard.appointmentsThisWeek")}
              icon={<Calendar className="h-4 w-4" />}
            />
            <StatCard
              title={t("navigation.clinicalHistories")}
              value={String(summary.totalHistories)}
              description={t("dashboard.totalHistories")}
              icon={<FileText className="h-4 w-4" />}
            />
            <StatCard
              title={t("dashboard.consultationsToday")}
              value={String(summary.consultationsToday)}
              description={t("dashboard.completedConsultations")}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.quickActions")}</CardTitle>
                <CardDescription>
                  {t("dashboard.quickActionsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <QuickAction
                  title={t("patients.newPatient")}
                  description={t("dashboard.registerNewPatient")}
                  icon={<Users className="h-5 w-5" />}
                  onClick={() => router.push("/patients/new")}
                />
                <QuickAction
                  title={t("clinicalHistories.newHistory")}
                  description={t("dashboard.createNewHistory")}
                  icon={<FileText className="h-5 w-5" />}
                  onClick={() => router.push("/clinical-histories/new")}
                />
                <QuickAction
                  title={t("patients.title")}
                  description={t("dashboard.viewPatientsList")}
                  icon={<Users className="h-5 w-5" />}
                  onClick={() => router.push("/patients")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.recentConsultations")}</CardTitle>
                <CardDescription>
                  {t("dashboard.recentConsultationsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summary.recentConsultations.length === 0 ? (
                  <EmptyState
                    type="clinical-histories"
                    title={t("dashboard.noRecentConsultations")}
                    description={t("dashboard.recentConsultationsDescription")}
                  />
                ) : (
                  <div className="space-y-4">
                    {summary.recentConsultations.map(
                      (item: RecentConsultation) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() =>
                            router.push(`/clinical-histories/${item.id}`)
                          }
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(`/clinical-histories/${item.id}`);
                            }
                          }}
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0">
                            {getInitials(
                              item.patientName,
                              item.patientLastName,
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {item.patientName} {item.patientLastName}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {item.consultationReason}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatConsultationDate(
                              item.createdAt,
                              t("common.today"),
                              t("common.yesterday"),
                              dateLocale,
                            )}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                )}
                <Button
                  variant="ghost"
                  className="w-full mt-4"
                  onClick={() => router.push("/clinical-histories")}
                >
                  {t("dashboard.viewAllHistories")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
