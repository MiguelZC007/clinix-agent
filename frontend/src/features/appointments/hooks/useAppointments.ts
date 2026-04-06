"use client";

import { useState, useEffect, useCallback } from "react";
import { toError } from "@/lib/utils";
import type { PaginatedData } from "@/types/contracts/api-response";
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getSpecialties,
} from "../api/appointments.api";
import type {
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentsListParams,
} from "../types/appointment.types";

type UseAppointmentListState = {
  data: PaginatedData<Appointment> | null;
  isLoading: boolean;
  error: Error | null;
};

export function useAppointmentList(params?: AppointmentsListParams) {
  const [state, setState] = useState<UseAppointmentListState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const page = params?.page;
  const pageSize = params?.pageSize;
  const limit = params?.limit;
  const date = params?.date;
  const startDate = params?.startDate;
  const endDate = params?.endDate;
  const status = params?.status;

  const fetchAppointments = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const requestParams: AppointmentsListParams | undefined =
        page === undefined &&
        pageSize === undefined &&
        limit === undefined &&
        date === undefined &&
        startDate === undefined &&
        endDate === undefined &&
        status === undefined
          ? undefined
          : { page, pageSize, limit, date, startDate, endDate, status };
      const data = await getAppointments(requestParams);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({ data: null, isLoading: false, error: toError(error) });
    }
  }, [page, pageSize, limit, date, startDate, endDate, status]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    ...state,
    refetch: fetchAppointments,
  };
}

type UseAppointmentState = {
  data: Appointment | null;
  isLoading: boolean;
  error: Error | null;
};

export function useAppointment(id: string) {
  const [state, setState] = useState<UseAppointmentState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchAppointment = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getAppointmentById(id);
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({ data: null, isLoading: false, error: toError(error) });
    }
  }, [id]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  return {
    ...state,
    refetch: fetchAppointment,
  };
}

type UseSpecialtiesState = {
  data: Array<{ id: string; name: string }> | null;
  isLoading: boolean;
  error: Error | null;
};

export function useSpecialties() {
  const [state, setState] = useState<UseSpecialtiesState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchSpecialties = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getSpecialties();
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({ data: null, isLoading: false, error: toError(error) });
    }
  }, []);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  return {
    ...state,
    refetch: fetchSpecialties,
  };
}

type MutationState = {
  isLoading: boolean;
  error: Error | null;
};

export function useCreateAppointment() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (data: CreateAppointmentRequest): Promise<Appointment> => {
      setState({ isLoading: true, error: null });
      try {
        const result = await createAppointment(data);
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

export function useUpdateAppointment() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (
      id: string,
      data: UpdateAppointmentRequest,
    ): Promise<Appointment> => {
      setState({ isLoading: true, error: null });
      try {
        const result = await updateAppointment(id, data);
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

export function useCancelAppointment() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(async (id: string): Promise<Appointment> => {
    setState({ isLoading: true, error: null });
    try {
      const result = await cancelAppointment(id);
      setState({ isLoading: false, error: null });
      return result;
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
