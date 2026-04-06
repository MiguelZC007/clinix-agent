"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getClinicalHistories,
  getPatientClinicHistoryFilterOptions,
} from "@/features/clinical-histories/api/clinical-histories.api";
import type { PatientClinicHistoryFilterOptions } from "@/features/clinical-histories/api/clinical-histories.api";
import type { ClinicalHistory } from "@/features/clinical-histories/types/clinical-history.types";
import type { ClinicalHistoriesListParams } from "@/features/clinical-histories/types/clinical-history.types";
import { toError } from "@/lib/utils";
import type { PaginatedData } from "@/types/contracts/api-response";
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientAntecedents,
} from "../api/patients.api";
import type {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientsListParams,
  PatientAntecedents,
} from "../types/patient.types";

type UsePatientListState = {
  data: PaginatedData<Patient> | null;
  isLoading: boolean;
  error: Error | null;
};

export function usePatientList(params?: PatientsListParams) {
  const [state, setState] = useState<UsePatientListState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const page = params?.page;
  const pageSize = params?.pageSize;
  const search = params?.search;

  const fetchPatients = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const requestParams: PatientsListParams | undefined =
        page === undefined && pageSize === undefined && search === undefined
          ? undefined
          : { page, pageSize, search };
      const data = await getPatients(requestParams);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({ data: null, isLoading: false, error: toError(error) });
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return {
    ...state,
    refetch: fetchPatients,
  };
}

type UsePatientState = {
  data: Patient | null;
  isLoading: boolean;
  error: Error | null;
};

export function usePatient(id: string) {
  const [state, setState] = useState<UsePatientState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchPatient = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getPatientById(id);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({ data: null, isLoading: false, error: toError(error) });
    }
  }, [id]);

  useEffect(() => {
    fetchPatient();
  }, [fetchPatient]);

  return {
    ...state,
    refetch: fetchPatient,
  };
}

type UsePatientAntecedentsState = {
  data: PatientAntecedents | null;
  isLoading: boolean;
  error: Error | null;
};

export function usePatientAntecedents(patientId: string | undefined) {
  const [state, setState] = useState<UsePatientAntecedentsState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchAntecedents = useCallback(async () => {
    if (!patientId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getPatientAntecedents(patientId);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({ data: null, isLoading: false, error: toError(error) });
    }
  }, [patientId]);

  useEffect(() => {
    fetchAntecedents();
  }, [fetchAntecedents]);

  return {
    ...state,
    refetch: fetchAntecedents,
  };
}

type UsePatientClinicHistoriesState = {
  data: PaginatedData<ClinicalHistory> | null;
  isLoading: boolean;
  error: Error | null;
};

export function usePatientClinicHistories(params: {
  patientId: string | undefined;
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
  doctorId?: string;
  specialtyId?: string;
}) {
  const {
    patientId,
    page = 1,
    pageSize = 10,
    dateFrom,
    dateTo,
    doctorId,
    specialtyId,
  } = params;

  const [state, setState] = useState<UsePatientClinicHistoriesState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const fetchHistories = useCallback(async () => {
    if (!patientId) {
      setState({
        data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 },
        isLoading: false,
        error: null,
      });
      return;
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const requestParams: ClinicalHistoriesListParams = {
        patientId,
        page,
        pageSize,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        doctorId: doctorId || undefined,
        specialtyId: specialtyId || undefined,
      };
      const data = await getClinicalHistories(requestParams);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: toError(error),
      });
    }
  }, [patientId, page, pageSize, dateFrom, dateTo, doctorId, specialtyId]);

  useEffect(() => {
    fetchHistories();
  }, [fetchHistories]);

  return {
    ...state,
    refetch: fetchHistories,
  };
}

type UsePatientClinicHistoryFilterOptionsState = {
  data: PatientClinicHistoryFilterOptions | null;
  isLoading: boolean;
  error: Error | null;
};

export function usePatientClinicHistoryFilterOptions(
  patientId: string | undefined,
) {
  const [state, setState] = useState<UsePatientClinicHistoryFilterOptionsState>(
    {
      data: null,
      isLoading: false,
      error: null,
    },
  );

  const fetchOptions = useCallback(async () => {
    if (!patientId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getPatientClinicHistoryFilterOptions(patientId);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: toError(error),
      });
    }
  }, [patientId]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return {
    ...state,
    refetch: fetchOptions,
  };
}

type MutationState = {
  isLoading: boolean;
  error: Error | null;
};

export function useCreatePatient() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (data: CreatePatientRequest): Promise<Patient> => {
      setState({ isLoading: true, error: null });
      try {
        const result = await createPatient(data);
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

export function useUpdatePatient() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (id: string, data: UpdatePatientRequest): Promise<Patient> => {
      setState({ isLoading: true, error: null });
      try {
        const result = await updatePatient(id, data);
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

export function useDeletePatient() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(async (id: string): Promise<void> => {
    setState({ isLoading: true, error: null });
    try {
      await deletePatient(id);
      setState({ isLoading: false, error: null });
    } catch (error) {
      setState({ isLoading: false, error: toError(error) });
      throw error;
    }
  }, []);

  return {
    ...state,
    mutate,
  };
}
