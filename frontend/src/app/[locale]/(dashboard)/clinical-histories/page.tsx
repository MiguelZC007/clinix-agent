"use client";

import { useState } from "react";
import { Plus, LayoutGrid, Table } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useClinicalHistoryList } from "@/features/clinical-histories/hooks/useClinicalHistories";
import type { ClinicalHistory } from "@/features/clinical-histories/types/clinical-history.types";
import { ClinicalHistoryCard } from "@/features/clinical-histories/ui/ClinicalHistoryCard";
import { ClinicalHistoryFilters } from "@/features/clinical-histories/ui/ClinicalHistoryFilters";
import { ClinicalHistoryTable } from "@/features/clinical-histories/ui/ClinicalHistoryTable";
import { useRouter } from "@/i18n/navigation";
import { getSafeErrorMessage } from "@/lib/utils/error-handler";
import { EmptyState } from "@/ui/molecules/EmptyState";
import { ErrorState } from "@/ui/molecules/ErrorState";
import { TableSkeleton } from "@/ui/molecules/TableSkeleton";
import { ListPageTemplate } from "@/ui/templates/ListPageTemplate";

const PAGE_SIZE = 10;
type ViewMode = "table" | "cards";

export default function ClinicalHistoriesPage() {
  const t = useTranslations();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const { data, isLoading, error, refetch } = useClinicalHistoryList({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const histories = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;

  const handleView = (history: ClinicalHistory) => {
    router.push(`/clinical-histories/${history.id}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setPage(1);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <ListPageTemplate
      title={t("clinicalHistories.title")}
      description={t("clinicalHistories.description")}
      actions={
        <Button onClick={() => router.push("/clinical-histories/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("clinicalHistories.newHistory")}
        </Button>
      }
      filters={
        <ClinicalHistoryFilters
          search={search}
          onSearchChange={handleSearchChange}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={handleDateFromChange}
          onDateToChange={handleDateToChange}
          onClear={handleClearFilters}
        />
      }
    >
      {isLoading ? (
        <TableSkeleton columns={5} rows={10} />
      ) : error ? (
        <ErrorState
          title={t("common.error")}
          description={getSafeErrorMessage(error, t)}
          retryLabel={t("common.retry")}
          onRetry={refetch}
        />
      ) : histories.length === 0 ? (
        <EmptyState
          type="clinical-histories"
          title={t("clinicalHistories.emptyTitle")}
          description={t("clinicalHistories.emptyDescription")}
          actionLabel={t("clinicalHistories.newHistory")}
          onAction={() => router.push("/clinical-histories/new")}
        />
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              aria-pressed={viewMode === "table"}
            >
              <Table className="h-4 w-4 mr-1" />
              {t("common.table")}
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
              aria-pressed={viewMode === "cards"}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              {t("common.cards")}
            </Button>
          </div>
          {viewMode === "table" ? (
            <ClinicalHistoryTable
              histories={histories}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onView={handleView}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {histories.map((history) => (
                <ClinicalHistoryCard
                  key={history.id}
                  history={history}
                  onClick={() => handleView(history)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </ListPageTemplate>
  );
}
