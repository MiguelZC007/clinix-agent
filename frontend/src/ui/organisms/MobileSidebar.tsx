"use client";

import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";

type MobileSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const t = useTranslations();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-64 p-0"
        closeLabel={t("common.close")}
      >
        <SheetTitle className="sr-only">{t("navigation.sidebar")}</SheetTitle>
        <SheetDescription className="sr-only">
          {t("navigation.sidebarDescription")}
        </SheetDescription>
        <Sidebar collapsed={false} />
      </SheetContent>
    </Sheet>
  );
}
