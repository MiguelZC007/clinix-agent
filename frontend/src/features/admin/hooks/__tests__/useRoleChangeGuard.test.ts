import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuth } from '@/lib/auth/hooks';
import { useRoleChangeGuard } from '../useRoleChangeGuard';

vi.mock('@/lib/auth/hooks', () => ({
  useAuth: vi.fn(),
}));

const ADMIN_USER = {
  id: 'admin-user-id',
  name: 'Admin',
  lastName: 'User',
  phone: '+1234567890',
  email: 'admin@example.com',
  role: 'ADMIN' as const,
};

const mockDoctor = {
  id: 'doctor-1',
  userId: 'other-user-id',
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

describe('useRoleChangeGuard — isRoleSupported', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      session: { user: ADMIN_USER, accessToken: 'token', expires: '' },
      user: ADMIN_USER,
      accessToken: 'token',
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
  });

  it('devuelve isRoleSupported=true cuando el doctor tiene role definido', () => {
    const doctorWithRole = { ...mockDoctor, role: 'DOCTOR' as const };
    const { result } = renderHook(() =>
      useRoleChangeGuard({ doctor: doctorWithRole, currentRole: undefined })
    );
    expect(result.current.isRoleSupported).toBe(true);
  });

  it('devuelve isRoleSupported=false cuando el doctor NO tiene role definido', () => {
    const { result } = renderHook(() =>
      useRoleChangeGuard({ doctor: mockDoctor, currentRole: undefined })
    );
    expect(result.current.isRoleSupported).toBe(false);
  });
});

describe('useRoleChangeGuard — isSelfAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve isSelfAdmin=true cuando el doctor es el mismo admin autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: ADMIN_USER, accessToken: 'token', expires: '' },
      user: ADMIN_USER,
      accessToken: 'token',
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
    const selfDoctor = { ...mockDoctor, userId: 'admin-user-id' };
    const { result } = renderHook(() =>
      useRoleChangeGuard({ doctor: selfDoctor, currentRole: undefined })
    );
    expect(result.current.isSelfAdmin).toBe(true);
  });

  it('devuelve isSelfAdmin=false cuando el doctor es otro usuario', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: ADMIN_USER, accessToken: 'token', expires: '' },
      user: ADMIN_USER,
      accessToken: 'token',
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
    const { result } = renderHook(() =>
      useRoleChangeGuard({ doctor: mockDoctor, currentRole: undefined })
    );
    expect(result.current.isSelfAdmin).toBe(false);
  });
});

describe('useRoleChangeGuard — self-demotion blocking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      session: { user: ADMIN_USER, accessToken: 'token', expires: '' },
      user: ADMIN_USER,
      accessToken: 'token',
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
  });

  it('bloquea la auto-democión cuando el admin edita su propio doctor y el nuevo rol es DOCTOR', () => {
    const selfDoctor = { ...mockDoctor, userId: 'admin-user-id', role: 'ADMIN' as const };
    const { result } = renderHook(() =>
      useRoleChangeGuard({ doctor: selfDoctor, currentRole: 'DOCTOR' })
    );
    expect(result.current.isSelfDemotionBlocked).toBe(true);
  });

  it('NO bloquea cuando el admin edita a otro usuario', () => {
    const otherDoctor = { ...mockDoctor, role: 'ADMIN' as const };
    const { result } = renderHook(() =>
      useRoleChangeGuard({ doctor: otherDoctor, currentRole: 'DOCTOR' })
    );
    expect(result.current.isSelfDemotionBlocked).toBe(false);
  });

  it('NO bloquea cuando el admin edita su propio perfil pero mantiene ADMIN', () => {
    const selfDoctor = { ...mockDoctor, userId: 'admin-user-id', role: 'ADMIN' as const };
    const { result } = renderHook(() =>
      useRoleChangeGuard({ doctor: selfDoctor, currentRole: 'ADMIN' })
    );
    expect(result.current.isSelfDemotionBlocked).toBe(false);
  });
});

describe('useRoleChangeGuard — requiresConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      session: { user: ADMIN_USER, accessToken: 'token', expires: '' },
      user: ADMIN_USER,
      accessToken: 'token',
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
  });

  it('requiere confirmación cuando hay un cambio de rol real (de DOCTOR a ADMIN)', () => {
    const doctorWithRole = { ...mockDoctor, role: 'DOCTOR' as const };
    const { result } = renderHook(() =>
      useRoleChangeGuard({ doctor: doctorWithRole, currentRole: 'ADMIN' })
    );
    expect(result.current.requiresConfirmation).toBe(true);
  });

  it('NO requiere confirmación cuando el rol no cambia', () => {
    const doctorWithRole = { ...mockDoctor, role: 'DOCTOR' as const };
    const { result } = renderHook(() =>
      useRoleChangeGuard({ doctor: doctorWithRole, currentRole: 'DOCTOR' })
    );
    expect(result.current.requiresConfirmation).toBe(false);
  });

  it('NO requiere confirmación cuando no hay currentRole (sin cambio)', () => {
    const { result } = renderHook(() =>
      useRoleChangeGuard({ doctor: mockDoctor, currentRole: undefined })
    );
    expect(result.current.requiresConfirmation).toBe(false);
  });
});
