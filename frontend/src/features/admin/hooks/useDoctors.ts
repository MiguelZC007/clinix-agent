"use client";

import { useState, useEffect, useCallback } from "react";
import { toError } from "@/lib/utils";
import type { PaginatedData } from "@/types/contracts/api-response";
import {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deactivateDoctor,
  activateDoctor,
} from "../api/doctors.api";
import { getAuditLogs, type AuditLog, type AuditLogsParams } from "../api/audit-logs.api";
import type {
  Doctor,
  CreateDoctorRequest,
  UpdateDoctorRequest,
  DoctorsListParams,
} from "../types/doctor.types";

type UseDoctorListState = {
  data: PaginatedData<Doctor> | null;
  isLoading: boolean;
  error: Error | null;
};

export function useDoctorList(params?: DoctorsListParams) {
  const [state, setState] = useState<UseDoctorListState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const page = params?.page;
  const pageSize = params?.pageSize;
  const search = params?.search;
  const isActive = params?.isActive;
  const specialtyId = params?.specialtyId;

  const fetchDoctors = useCallback(async () => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const requestParams: DoctorsListParams | undefined =
        page === undefined && pageSize === undefined && search === undefined && isActive === undefined && specialtyId === undefined
          ? undefined
          : { page, pageSize, search, isActive, specialtyId };
      const data = await getDoctors(requestParams);
      if (!controller.signal.aborted) {
        setState({ data, isLoading: false, error: null });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setState({ data: null, isLoading: false, error: toError(error) });
      }
    }
    return () => controller.abort();
  }, [page, pageSize, search, isActive, specialtyId]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    fetchDoctors().then((fn) => {
      cleanup = fn;
    });
    return () => {
      cleanup?.();
    };
  }, [fetchDoctors]);

  return {
    ...state,
    refetch: fetchDoctors,
  };
}

type UseDoctorAuditLogsState = {
  data: PaginatedData<AuditLog> | null;
  isLoading: boolean;
  error: Error | null;
};

export function useDoctorAuditLogs(doctorId: string | undefined, page = 1, pageSize = 10) {
  const [state, setState] = useState<UseDoctorAuditLogsState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchAuditLogs = useCallback(async () => {
    if (!doctorId) {
      setState({
        data: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 },
        isLoading: false,
        error: null,
      });
      return;
    }
    const controller = new AbortController();
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const params: AuditLogsParams = {
        page,
        pageSize,
        entityType: "Doctor",
        entityId: doctorId,
      };
      const data = await getAuditLogs(params);
      if (!controller.signal.aborted) {
        setState({ data, isLoading: false, error: null });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setState({ data: null, isLoading: false, error: toError(error) });
      }
    }
    return () => controller.abort();
  }, [doctorId, page, pageSize]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    fetchAuditLogs().then((fn) => {
      cleanup = fn;
    });
    return () => {
      cleanup?.();
    };
  }, [fetchAuditLogs]);

  return {
    ...state,
    refetch: fetchAuditLogs,
  };
}

type UseDoctorState = {
  data: Doctor | null;
  isLoading: boolean;
  error: Error | null;
};

export function useDoctor(id: string) {
  const [state, setState] = useState<UseDoctorState>({
    data: null,
    isLoading: true,
    error: null,
  });

  const fetchDoctor = useCallback(async () => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await getDoctorById(id);
      if (!controller.signal.aborted) {
        setState({ data, isLoading: false, error: null });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setState({ data: null, isLoading: false, error: toError(error) });
      }
    }
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    fetchDoctor().then((fn) => {
      cleanup = fn;
    });
    return () => {
      cleanup?.();
    };
  }, [fetchDoctor]);

  return {
    ...state,
    refetch: fetchDoctor,
  };
}

type MutationState = {
  isLoading: boolean;
  error: Error | null;
};

export function useCreateDoctor() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (data: CreateDoctorRequest): Promise<Doctor> => {
      setState({ isLoading: true, error: null });
      try {
        const result = await createDoctor(data);
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

export function useUpdateDoctor() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (id: string, data: UpdateDoctorRequest): Promise<Doctor> => {
      setState({ isLoading: true, error: null });
      try {
        const result = await updateDoctor(id, data);
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

export function useDeactivateDoctor() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(async (id: string): Promise<Doctor> => {
    setState({ isLoading: true, error: null });
    try {
      const result = await deactivateDoctor(id);
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

export function useActivateDoctor() {
  const [state, setState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(async (id: string): Promise<Doctor> => {
    setState({ isLoading: true, error: null });
    try {
      const result = await activateDoctor(id);
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
