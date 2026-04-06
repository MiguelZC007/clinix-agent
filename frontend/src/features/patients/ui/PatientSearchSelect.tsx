"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDownIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getPatients } from "../api/patients.api";
import type { Patient } from "../types/patient.types";

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 100;

type PatientSearchSelectProps = {
  value: string;
  onChange: (patientId: string, patient?: Patient) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  displayEmail?: boolean;
};

export function PatientSearchSelect({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  displayEmail = false,
}: PatientSearchSelectProps) {
  const t = useTranslations("patients");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const fetchPatients = useCallback(async (search: string) => {
    setLoading(true);
    setError(false);
    try {
      const data = await getPatients({
        search: search || undefined,
        pageSize: PAGE_SIZE,
      });
      setPatients(data.items);
    } catch {
      setPatients([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchPatients(debouncedQuery);
  }, [open, debouncedQuery, fetchPatients]);

  useEffect(() => {
    if (!value && selectedPatient) setSelectedPatient(null);
  }, [value, selectedPatient]);

  const handleSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    onChange(patient.id, patient);
    setOpen(false);
    setQuery("");
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
    if (next) setTimeout(() => inputRef.current?.focus(), 0);
  };

  const displayLabel = selectedPatient
    ? displayEmail
      ? `${selectedPatient.name} ${selectedPatient.lastName} - ${selectedPatient.email}`
      : `${selectedPatient.name} ${selectedPatient.lastName}`
    : null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal h-9 px-3",
            !displayLabel && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {displayLabel ?? placeholder ?? t("selectPatient")}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <div className="p-2 border-b">
          <Input
            ref={inputRef}
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9"
            autoComplete="off"
          />
        </div>
        <ScrollArea className="h-[min(280px,var(--radix-popover-content-available-height))]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-6 text-center text-sm text-destructive">
              {t("searchError")}
            </div>
          ) : patients.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {debouncedQuery ? t("searchNoResults") : t("searchTypeToSearch")}
            </div>
          ) : (
            <ul className="p-1">
              {patients.map((patient) => (
                <li key={patient.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full text-left px-2 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground",
                      value === patient.id && "bg-accent",
                    )}
                    onClick={() => handleSelect(patient)}
                  >
                    {displayEmail
                      ? `${patient.name} ${patient.lastName} - ${patient.email}`
                      : `${patient.name} ${patient.lastName}`}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
