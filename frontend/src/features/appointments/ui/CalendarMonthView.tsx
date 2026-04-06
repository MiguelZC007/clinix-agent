"use client";

import { useTranslations, useLocale } from "next-intl";
import { cn, toDateLocale, isSameDayUTC } from "@/lib/utils";
import type { Appointment } from "../types/appointment.types";

type CalendarMonthViewProps = {
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onDayClick?: (date: Date) => void;
};

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

function getMonthDays(date: Date): (Date | null)[][] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let startDay = firstDay.getDay() - 1;
  if (startDay === -1) startDay = 6;

  const days: (Date | null)[][] = [];
  let week: (Date | null)[] = [];

  for (let i = 0; i < startDay; i++) {
    week.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    week.push(new Date(year, month, day));
    if (week.length === 7) {
      days.push(week);
      week = [];
    }
  }

  while (week.length > 0 && week.length < 7) {
    week.push(null);
  }
  if (week.length > 0) {
    days.push(week);
  }

  return days;
}

function getStatusColor(status: Appointment["status"]) {
  switch (status) {
    case "scheduled":
      return "bg-blue-500 hover:bg-blue-600";
    case "completed":
      return "bg-emerald-500 hover:bg-emerald-600";
    case "cancelled":
      return "bg-red-500 hover:bg-red-600";
    case "pending":
      return "bg-yellow-500 hover:bg-yellow-600";
    case "confirmed":
      return "bg-green-500 hover:bg-green-600";
    default:
      return "bg-blue-500 hover:bg-blue-600";
  }
}

export function CalendarMonthView({
  currentDate,
  appointments,
  onAppointmentClick,
  onDayClick,
}: CalendarMonthViewProps) {
  const t = useTranslations();
  const dateLocale = toDateLocale(useLocale());
  const weeks = getMonthDays(currentDate);
  const today = new Date();

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/30 border-b">
        {DAY_KEYS.map((dayKey) => (
          <div
            key={dayKey}
            className="text-center py-2 text-sm font-medium text-muted-foreground"
          >
            {t(`calendar.days.${dayKey}`)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.map((week, weekIdx) =>
          week.map((day, dayIdx) => {
            if (!day) {
              return (
                <div
                  key={`${weekIdx}-${dayIdx}`}
                  className="min-h-[120px] border-b border-r bg-muted/20"
                />
              );
            }

            const isToday = isSameDayUTC(day, today);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const dayAppointments = appointments.filter((apt) =>
              isSameDayUTC(apt.date, day),
            );
            const visibleAppointments = dayAppointments.slice(0, 3);
            const remainingCount = dayAppointments.length - 3;

            return (
              <div
                key={`${weekIdx}-${dayIdx}`}
                className={cn(
                  "min-h-[120px] border-b border-r p-1 cursor-pointer hover:bg-muted/30 transition-colors",
                  !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                )}
                role="button"
                tabIndex={0}
                aria-label={day.toLocaleDateString(dateLocale, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                onClick={() => onDayClick?.(day)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onDayClick?.(day);
                  }
                }}
              >
                <div
                  className={cn(
                    "text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {day.getDate()}
                </div>
                <ul className="space-y-0.5" role="list">
                  {visibleAppointments.map((apt) => (
                    <li
                      key={apt.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${apt.patientName}, ${apt.startTime} - ${apt.endTime}, ${apt.status}`}
                      className={cn(
                        "text-xs text-white px-1.5 py-0.5 rounded truncate cursor-pointer transition-colors",
                        getStatusColor(apt.status),
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick?.(apt);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          e.preventDefault();
                          onAppointmentClick?.(apt);
                        }
                      }}
                    >
                      {apt.startTime} {apt.patientName}
                    </li>
                  ))}
                  {remainingCount > 0 && (
                    <li className="text-xs text-muted-foreground px-1.5">
                      {t("calendar.more", { count: remainingCount })}
                    </li>
                  )}
                </ul>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
