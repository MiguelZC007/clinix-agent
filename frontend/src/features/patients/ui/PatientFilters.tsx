'use client';

import { useTranslations } from 'next-intl';
import { SearchInput } from '@/ui/molecules/SearchInput';

type PatientFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export function PatientFilters({ search, onSearchChange }: PatientFiltersProps) {
  const t = useTranslations();

  return (
    <SearchInput
      value={search}
      onChange={onSearchChange}
      placeholder={t('common.search')}
      className="w-full max-w-sm"
      data-testid="patient-filters"
    />
  );
}
