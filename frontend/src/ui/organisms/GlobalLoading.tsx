"use client";

import { useEffect } from "react";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { useLoading } from "@/lib/hooks/useLoading";
import {
  navigationLoadingAtom,
  apiLoadingAtom,
  loadingMessageAtom,
} from "@/lib/store/loading.atoms";
import { LoadingSpinner } from "@/ui/atoms/LoadingSpinner";

export function GlobalLoading() {
  const navigationLoading = useAtomValue(navigationLoadingAtom);
  const apiLoading = useAtomValue(apiLoadingAtom);
  const loadingMessage = useAtomValue(loadingMessageAtom);
  const t = useTranslations();
  const { clearLoading } = useLoading();

  const isLoading = navigationLoading || apiLoading;

  useEffect(() => {
    if (!isLoading) {
      clearLoading();
    }
  }, [isLoading, clearLoading]);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" label={t("common.loading")} />
        {loadingMessage && (
          <p className="text-sm text-muted-foreground">{loadingMessage}</p>
        )}
        {!loadingMessage && navigationLoading && (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        )}
      </div>
    </div>
  );
}
