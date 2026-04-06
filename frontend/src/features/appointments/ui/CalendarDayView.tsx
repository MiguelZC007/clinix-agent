"use client";

import { cn, isSameDayUTC } from "@/lib/utils";
import type { Appointment } from "../types/appointment.types";

type CalendarDayViewProps = {
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getAppointmentStyle(startTime: string, endTime: string) {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  const top = (startHour * 60 + startMin) * (64 / 60);
  const height =
    (endHour * 60 + endMin - (startHour * 60 + startMin)) * (64 / 60);
  return { top: `${top}px`, height: `${Math.max(height, 24)}px` };
}

function getStatusColor(status: Appointment["status"]) {
  switch (status) {
    case "scheduled":
      return "bg-blue-500/90 hover:bg-blue-500 border-blue-600";
    case "completed":
      return "bg-emerald-500/90 hover:bg-emerald-500 border-emerald-600";
    case "cancelled":
      return "bg-red-500/90 hover:bg-red-500 border-red-600";
    case "pending":
      return "bg-yellow-500/90 hover:bg-yellow-500 border-yellow-600";
    case "confirmed":
      return "bg-green-500/90 hover:bg-green-500 border-green-600";
    default:
      return "bg-blue-500/90 hover:bg-blue-500 border-blue-600";
  }
}

export function CalendarDayView({
  currentDate,
  appointments,
  onAppointmentClick,
}: CalendarDayViewProps) {
  const dayAppointments = appointments.filter((apt) =>
    isSameDayUTC(apt.date, currentDate),
  );

  const now = new Date();
  const isToday = isSameDayUTC(currentDate, now);
  const currentTimeTop = isToday
    ? (now.getHours() * 60 + now.getMinutes()) * (64 / 60)
    : -1;

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[600px] border rounded-lg overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="relative" style={{ height: `${24 * 64}px` }}>
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full flex"
              style={{ top: `${hour * 64}px`, height: "64px" }}
            >
              <div className="w-16 shrink-0 text-xs text-muted-foreground text-right pr-2 -mt-2">
                {hour.toString().padStart(2, "0")}:00
              </div>
              <div className="flex-1 border-t border-border" />
            </div>
          ))}

          {isToday && currentTimeTop >= 0 && (
            <div
              className="absolute left-16 right-0 flex items-center z-20 pointer-events-none"
              style={{ top: `${currentTimeTop}px` }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
              <div className="flex-1 h-0.5 bg-red-500" />
            </div>
          )}

          <div className="absolute left-16 right-2 top-0 bottom-0">
            {dayAppointments.map((apt) => (
              <div
                key={apt.id}
                className={cn(
                  "absolute left-1 right-1 rounded-md px-2 py-1 text-white text-sm cursor-pointer transition-colors border-l-4",
                  getStatusColor(apt.status),
                )}
                style={getAppointmentStyle(apt.startTime, apt.endTime)}
                role="button"
                tabIndex={0}
                aria-label={`${apt.patientName} — ${apt.startTime} - ${apt.endTime}`}
                onClick={() => onAppointmentClick?.(apt)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onAppointmentClick?.(apt);
                  }
                }}
              >
                <div className="font-medium truncate">{apt.patientName}</div>
                <div className="text-xs opacity-90 truncate">
                  {apt.startTime} - {apt.endTime} · {apt.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
