"use client";

import { useState, useEffect, useCallback } from "react";
import { toError } from "@/lib/utils";
import type { PaginatedData } from "@/types/contracts/api-response";
import {
  getClinicalHistories,
  getClinicalHistoryById,
  createClinicalHistory,
} from "../api/clinical-histories.api";
import type {
  ClinicalHistory,
  ClinicalHistoriesListParams,
} from "../types/clinical-history.types";
import type { CreateClinicHistoryBackendPayload } from "../types/create-clinical-history-backend.types";

type UseClinicalHistoryListState = {
  data: PaginatedData<ClinicalHistory> | null;
  isLoading: boolean;
  error: Error | null;
};

export function useClinicalHistoryList(params?: ClinicalHistoriesListParams) {
  const [state, setState] = useState<UseClinicalHistoryListState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const page = params?.page;
  const pageSize = params?.pageSize;
  const patientId = params?.patientId;
  const search = params?.search;
  const dateFrom = params?.dateFrom;
  const dateTo = params?.dateTo;
  const doctorId = params?.doctorId;
  const specialtyId = params?.specialtyId;

  const fetchHistories = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const hasParams =
        page !== undefined ||
        pageSize !== undefined ||
        patientId !== undefined ||
        search !== undefined ||
        dateFrom !== undefined ||
        dateTo !== undefined ||
        doctorId !== undefined ||
        specialtyId !== undefined;
      const requestParams: ClinicalHistoriesListParams | undefined = hasParams
        ? {
            page,
            pageSize,
            patientId,
            search,
            dateFrom,
            dateTo,
            doctorId,
            specialtyId,
          }
        : undefined;
      const data = await getClinicalHistories(requestParams);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({ data: null, isLoading: false, error: toError(error) });
    }
  }, [
    page,
    pageSize,
    patientId,
    search,
    dateFrom,
    dateTo,
    doctorId,
    specialtyId,
  ]);

  useEffect(() => {
    fetchHistories();
  }, [fetchHistories]);

  return {
    ...state,
    refetch: fetchHistories,
  };
}

type UseClinicalHistoryState = {
  data: ClinicalHistory | null;
  isLoading: boolean;
  error: Error | null;
};

export function useClinicalHistory(id: string) {
  const [state, setState] = useState<UseClinicalHistoryState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchHistory = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getClinicalHistoryById(id);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({ data: null, isLoading: false, error: toError(error) });
    }
  }, [id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    ...state,
    refetch: fetchHistory,
  };
}

type MutationState = {
  isLoading: boolean;
  error: Error | null;
};

export function useCreateClinicalHistory() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (
      data: CreateClinicHistoryBackendPayload,
    ): Promise<ClinicalHistory> => {
      setState({ isLoading: true, error: null });
      try {
        const result = await createClinicalHistory(data);
        setState({ isLoading: false, error: null });
        return result;
      } catch (error) {
        setState({ isLoading: false, error: toError(error) });
        throw error;
      }
    },
    [],
  );

  return {
    ...state,
    mutate,
  };
}
