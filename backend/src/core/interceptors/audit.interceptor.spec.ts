/* eslint-disable @typescript-eslint/unbound-method */
import { CallHandler, ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from 'src/modules/audit/audit.service';
import { AUDIT_METADATA_KEY } from '../decorators/audit.decorator';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let reflector: jest.Mocked<Reflector>;
  let auditService: jest.Mocked<AuditService>;

  const createContext = (overrides?: {
    userId?: string;
    params?: Record<string, string>;
    path?: string;
  }): ExecutionContext => {
    const request = {
      user: overrides?.userId ? { id: overrides.userId } : undefined,
      params: overrides?.params ?? {},
      path: overrides?.path ?? '/admin/doctors/doctor-uuid',
      method: 'PATCH',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('jest-agent'),
    };

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    auditService = {
      log: jest.fn().mockResolvedValue({
        id: 'audit-log-id',
        userId: 'admin-uuid',
        userName: 'Admin Test',
        action: 'UPDATE',
        entityType: 'Doctor',
        entityId: 'doctor-uuid',
        previousState: null,
        newState: null,
        result: 'SUCCESS',
        errorMessage: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      }),
      findAll: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;

    interceptor = new AuditInterceptor(reflector, auditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registra éxito cuando el endpoint auditado responde OK', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'UPDATE',
      entityType: 'Doctor',
      entityIdParam: 'id',
    });

    const context = createContext({
      userId: 'admin-uuid',
      params: { id: 'doctor-uuid' },
    });
    const next: CallHandler = { handle: () => of({ id: 'doctor-uuid' }) };

    await new Promise<void>((resolve, reject) => {
      interceptor.intercept(context, next).subscribe({
        complete: resolve,
        error: reject,
      });
    });

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      AUDIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-uuid',
        action: 'UPDATE',
        entityType: 'Doctor',
        entityId: 'doctor-uuid',
        result: 'SUCCESS',
      }),
    );
  });

  it('registra failure cuando el endpoint auditado lanza error', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      action: 'DEACTIVATE',
      entityType: 'Doctor',
      entityIdParam: 'id',
    });

    const context = createContext({
      userId: 'admin-uuid',
      params: { id: 'doctor-uuid' },
    });
    const next: CallHandler = {
      handle: () =>
        throwError(() => new HttpException('doctor-not-found', 404)),
    };

    await expect(
      new Promise<void>((resolve, reject) => {
        interceptor.intercept(context, next).subscribe({
          complete: resolve,
          error: reject,
        });
      }),
    ).rejects.toThrow('doctor-not-found');

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-uuid',
        action: 'DEACTIVATE',
        entityType: 'Doctor',
        entityId: 'doctor-uuid',
        result: 'FAILURE',
        errorMessage: 'doctor-not-found',
      }),
    );
  });

  it('no audita cuando no hay metadata decorada', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const context = createContext({ userId: 'admin-uuid' });
    const next: CallHandler = { handle: () => of({ ok: true }) };

    await new Promise<void>((resolve, reject) => {
      interceptor.intercept(context, next).subscribe({
        complete: resolve,
        error: reject,
      });
    });

    expect(auditService.log).not.toHaveBeenCalled();
  });
});
