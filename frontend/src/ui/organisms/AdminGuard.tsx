"use client";

import { ShieldOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/hooks";
import { LoadingSpinner } from "@/ui/atoms/LoadingSpinner";

type AdminGuardProps = {
  children: React.ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const t = useTranslations();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center" data-testid="admin-guard-loading">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (user.role !== "ADMIN") {
    return (
      <div
        className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center"
        data-testid="admin-guard-denied"
      >
        <ShieldOff className="h-16 w-16 text-muted-foreground" />
        <div>
          <h2 className="text-xl font-semibold">{t("admin.accessDenied")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.accessDeniedDescription")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard")}
          data-testid="btn-back-to-dashboard"
        >
          {t("admin.backToDashboard")}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
