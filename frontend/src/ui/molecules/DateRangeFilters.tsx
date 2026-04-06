"use client";

import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DateRangeFiltersProps = {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  dateFromLabel: string;
  dateToLabel: string;
  calendarButtonLabel?: string;
  idPrefix: string;
  className?: string;
};

function parseLocalDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  // Create at noon to avoid timezone off-by-one shifts
  return new Date(year, month - 1, day, 12, 0, 0);
}

function formatLocalDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DateRangeFilters({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  dateFromLabel,
  dateToLabel,
  calendarButtonLabel,
  idPrefix,
  className,
}: DateRangeFiltersProps) {
  const dateFromDate = parseLocalDate(dateFrom);
  const dateToDate = parseLocalDate(dateTo);

  return (
    <div className={cn("flex flex-wrap items-end gap-2", className)}>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-date-from`} className="text-xs">
          {dateFromLabel}
        </Label>
        <div className="flex gap-1">
          <Input
            id={`${idPrefix}-date-from`}
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-[140px]"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label={
                  calendarButtonLabel
                    ? `${calendarButtonLabel} — ${dateFromLabel}`
                    : dateFromLabel
                }
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFromDate}
                onSelect={(d) => d && onDateFromChange(formatLocalDate(d))}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-date-to`} className="text-xs">
          {dateToLabel}
        </Label>
        <div className="flex gap-1">
          <Input
            id={`${idPrefix}-date-to`}
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-[140px]"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label={
                  calendarButtonLabel
                    ? `${calendarButtonLabel} — ${dateToLabel}`
                    : dateToLabel
                }
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateToDate}
                onSelect={(d) => d && onDateToChange(formatLocalDate(d))}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
