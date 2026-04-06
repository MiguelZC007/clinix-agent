"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DateRangeFilters } from "@/ui/molecules/DateRangeFilters";
import { SearchInput } from "@/ui/molecules/SearchInput";

type ClinicalHistoryFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onClear?: () => void;
};

export function ClinicalHistoryFilters({
  search,
  onSearchChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
}: ClinicalHistoryFiltersProps) {
  const t = useTranslations();
  const hasFilters = search !== "" || dateFrom !== "" || dateTo !== "";

  return (
    <div className="flex flex-wrap items-end gap-4" data-testid="clinical-history-filters">
      <div className="w-full min-w-[200px] max-w-sm">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={t("clinicalHistories.searchPlaceholder")}
          className="w-full"
          data-testid="input-search"
        />
      </div>
      <DateRangeFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
        dateFromLabel={t("clinicalHistories.dateFrom")}
        dateToLabel={t("clinicalHistories.dateTo")}
        calendarButtonLabel={t("common.openCalendar")}
        idPrefix="clinical-history"
      />
      {hasFilters && onClear && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClear}
          data-testid="clinical-history-filters-clear"
        >
          {t("clinicalHistories.clearFilters")}
        </Button>
      )}
    </div>
  );
}
