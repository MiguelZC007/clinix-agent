'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDashboardSummary } from '../api/dashboard.api';
import type { DashboardSummary } from '../types/dashboard.types';

type UseDashboardSummaryState = {
  data: DashboardSummary | null;
  isLoading: boolean;
  error: Error | null;
};

export function useDashboardSummary() {
  const [state, setState] = useState<UseDashboardSummaryState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchSummary = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getDashboardSummary();
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({ data: null, isLoading: false, error: error as Error });
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    ...state,
    refetch: fetchSummary,
  };
}
