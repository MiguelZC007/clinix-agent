"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { toDateLocale } from "@/lib/utils";
import type { CalendarView } from "../types/appointment.types";

type CalendarHeaderProps = {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onNavigate: (direction: "prev" | "next" | "today") => void;
};

export function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onNavigate,
}: CalendarHeaderProps) {
  const t = useTranslations();
  const dateLocale = toDateLocale(useLocale());

  const formatTitle = () => {
    const options: Intl.DateTimeFormatOptions = {
      month: "long",
      year: "numeric",
    };
    if (view === "day") {
      return currentDate.toLocaleDateString(dateLocale, {
        ...options,
        day: "numeric",
        weekday: "long",
      });
    }
    if (view === "week") {
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${startOfWeek.toLocaleDateString(dateLocale, options)}`;
      }
      return `${startOfWeek.toLocaleDateString(dateLocale, { day: "numeric", month: "short" })} - ${endOfWeek.toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString(dateLocale, options);
  };

  const views: { key: CalendarView; labelKey: string }[] = [
    { key: "day", labelKey: "calendar.day" },
    { key: "week", labelKey: "calendar.week" },
    { key: "month", labelKey: "calendar.month" },
  ];

  return (
    <div className="flex items-center justify-between pb-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onNavigate("today")}>
          {t("calendar.today")}
        </Button>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("prev")}
            aria-label={t("calendar.previousPeriod")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("next")}
            aria-label={t("calendar.nextPeriod")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold capitalize ml-2">
          {formatTitle()}
        </h2>
      </div>
      <div
        className="flex items-center gap-1 bg-muted rounded-lg p-1"
        role="group"
        aria-label={t("calendar.viewSelector")}
      >
        {views.map((v) => (
          <Button
            key={v.key}
            variant={view === v.key ? "default" : "ghost"}
            size="sm"
            onClick={() => onViewChange(v.key)}
            aria-pressed={view === v.key}
            className="px-3"
          >
            {t(v.labelKey)}
          </Button>
        ))}
      </div>
    </div>
  );
}
