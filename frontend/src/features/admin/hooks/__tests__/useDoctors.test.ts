import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as doctorsApi from '../../api/doctors.api';
import * as auditLogsApi from '../../api/audit-logs.api';
import {
  useDoctorList,
  useDoctor,
  useCreateDoctor,
  useUpdateDoctor,
  useDeactivateDoctor,
  useActivateDoctor,
  useDoctorAuditLogs,
} from '../useDoctors';

vi.mock('../../api/doctors.api');
vi.mock('../../api/audit-logs.api');

describe('useDoctorList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicia con isLoading true', async () => {
    vi.mocked(doctorsApi.getDoctors).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    });

    const { result } = renderHook(() => useDoctorList());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('carga doctores exitosamente', async () => {
    const mockDoctors = {
      items: [
        {
          id: '1',
          userId: 'user-1',
          email: 'doctor@example.com',
          name: 'Carlos',
          lastName: 'García',
          phone: '+584241234567',
          specialtyId: 'spec-1',
          specialtyName: 'Cardiología',
          licenseNumber: 'MP-12345',
          isActive: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };

    vi.mocked(doctorsApi.getDoctors).mockResolvedValue(mockDoctors);

    const { result } = renderHook(() => useDoctorList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockDoctors);
    expect(result.current.error).toBeNull();
  });

  it('maneja errores correctamente', async () => {
    const error = new Error('Network error');
    vi.mocked(doctorsApi.getDoctors).mockRejectedValue(error);

    const { result } = renderHook(() => useDoctorList());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toBeNull();
  });

  it('filtra por estado activo', async () => {
    const mockDoctors = {
      items: [
        {
          id: '1',
          userId: 'user-1',
          email: 'doctor@example.com',
          name: 'Carlos',
          lastName: 'García',
          phone: '+584241234567',
          specialtyId: 'spec-1',
          specialtyName: 'Cardiología',
          licenseNumber: 'MP-12345',
          isActive: true,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };

    vi.mocked(doctorsApi.getDoctors).mockResolvedValue(mockDoctors);

    const { result } = renderHook(() => useDoctorList({ isActive: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(doctorsApi.getDoctors).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true })
    );
  });
});

describe('useDoctor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carga doctor por id', async () => {
    const mockDoctor = {
      id: '1',
      userId: 'user-1',
      email: 'doctor@example.com',
      name: 'Carlos',
      lastName: 'García',
      phone: '+584241234567',
      specialtyId: 'spec-1',
      specialtyName: 'Cardiología',
      licenseNumber: 'MP-12345',
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };

    vi.mocked(doctorsApi.getDoctorById).mockResolvedValue(mockDoctor);

    const { result } = renderHook(() => useDoctor('1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockDoctor);
  });
});

describe('useCreateDoctor', () => {
  it('crea doctor correctamente', async () => {
    const newDoctor = {
      email: 'nuevo@example.com',
      name: 'Nuevo',
      lastName: 'Doctor',
      phone: '+584249999999',
      specialtyId: 'spec-1',
      licenseNumber: 'MP-99999',
      password: 'password123',
    };

    const createdDoctor = {
      ...newDoctor,
      id: '999',
      userId: 'user-999',
      specialtyName: 'Cardiología',
      isActive: true,
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
    };

    vi.mocked(doctorsApi.createDoctor).mockResolvedValue(createdDoctor);

    const { result } = renderHook(() => useCreateDoctor());

    const doctor = await result.current.mutate(newDoctor);

    expect(doctor).toEqual(createdDoctor);
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useUpdateDoctor', () => {
  it('actualiza doctor correctamente', async () => {
    const updates = { name: 'Actualizado' };
    const updatedDoctor = {
      id: '1',
      userId: 'user-1',
      email: 'doctor@example.com',
      name: 'Actualizado',
      lastName: 'García',
      phone: '+584241234567',
      specialtyId: 'spec-1',
      specialtyName: 'Cardiología',
      licenseNumber: 'MP-12345',
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
    };

    vi.mocked(doctorsApi.updateDoctor).mockResolvedValue(updatedDoctor);

    const { result } = renderHook(() => useUpdateDoctor());

    const doctor = await result.current.mutate('1', updates);

    expect(doctor.name).toBe('Actualizado');
  });
});

describe('useDeactivateDoctor', () => {
  it('desactiva doctor correctamente', async () => {
    const deactivatedDoctor = {
      id: '1',
      userId: 'user-1',
      email: 'doctor@example.com',
      name: 'Carlos',
      lastName: 'García',
      phone: '+584241234567',
      specialtyId: 'spec-1',
      specialtyName: 'Cardiología',
      licenseNumber: 'MP-12345',
      isActive: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
    };

    vi.mocked(doctorsApi.deactivateDoctor).mockResolvedValue(deactivatedDoctor);

    const { result } = renderHook(() => useDeactivateDoctor());

    const doctor = await result.current.mutate('1');

    expect(doctor.isActive).toBe(false);
    expect(doctorsApi.deactivateDoctor).toHaveBeenCalledWith('1');
  });
});

describe('useActivateDoctor', () => {
  it('activa doctor correctamente', async () => {
    const activatedDoctor = {
      id: '1',
      userId: 'user-1',
      email: 'doctor@example.com',
      name: 'Carlos',
      lastName: 'García',
      phone: '+584241234567',
      specialtyId: 'spec-1',
      specialtyName: 'Cardiología',
      licenseNumber: 'MP-12345',
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
    };

    vi.mocked(doctorsApi.activateDoctor).mockResolvedValue(activatedDoctor);

    const { result } = renderHook(() => useActivateDoctor());

    const doctor = await result.current.mutate('1');

    expect(doctor.isActive).toBe(true);
    expect(doctorsApi.activateDoctor).toHaveBeenCalledWith('1');
  });
});

describe('useDoctorAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carga logs de auditoría del doctor', async () => {
    const mockLogs = {
      items: [
        {
          id: 'log-1',
          userId: 'admin-1',
          userName: 'Admin',
          userEmail: 'admin@example.com',
          action: 'CREATE',
          entityType: 'Doctor',
          entityId: '1',
          previousState: null,
          newState: { name: 'Carlos' },
          result: 'SUCCESS',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          createdAt: '2024-01-15T10:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };

    vi.mocked(auditLogsApi.getAuditLogs).mockResolvedValue(mockLogs);

    const { result } = renderHook(() => useDoctorAuditLogs('1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockLogs);
    expect(auditLogsApi.getAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'Doctor',
        entityId: '1',
      })
    );
  });

  it('retorna datos vacíos cuando no hay doctorId', async () => {
    const { result } = renderHook(() => useDoctorAuditLogs(undefined));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.items).toHaveLength(0);
  });
});
