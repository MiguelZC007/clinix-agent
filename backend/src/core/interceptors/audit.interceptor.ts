import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { AuditService } from 'src/modules/audit/audit.service';
import {
  AUDIT_METADATA_KEY,
  AuditDecoratorOptions,
} from '../decorators/audit.decorator';

type RequestWithUser = Request & {
  user?: {
    id?: string;
  };
  route?: {
    path?: string;
  };
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditConfig = this.reflector.getAllAndOverride<AuditDecoratorOptions>(
      AUDIT_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!auditConfig || context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.id;

    if (!userId) {
      return next.handle();
    }

    const entityId = this.resolveEntityId(request, auditConfig.entityIdParam);
    const action = `${request.method} ${request.path}`;

    return next.handle().pipe(
      tap((responseBody) => {
        void this.auditService.log({
          userId,
          action: auditConfig.action || action,
          entityType: auditConfig.entityType,
          entityId,
          newState: this.extractNewState(responseBody),
          result: 'SUCCESS',
          ipAddress: request.ip,
          userAgent: request.get('user-agent') ?? undefined,
        });
      }),
      catchError((error: unknown) => {
        void this.auditService.log({
          userId,
          action: auditConfig.action || action,
          entityType: auditConfig.entityType,
          entityId,
          result: 'FAILURE',
          errorMessage:
            error instanceof Error ? error.message : 'unknown-error',
          ipAddress: request.ip,
          userAgent: request.get('user-agent') ?? undefined,
        });

        return throwError(() => error);
      }),
    );
  }

  private resolveEntityId(
    request: RequestWithUser,
    entityIdParam?: string,
  ): string | undefined {
    if (!entityIdParam) {
      return undefined;
    }

    const value = request.params?.[entityIdParam];

    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private extractNewState(
    responseBody: unknown,
  ): Record<string, unknown> | undefined {
    if (
      !responseBody ||
      typeof responseBody !== 'object' ||
      Array.isArray(responseBody)
    ) {
      return undefined;
    }

    return responseBody as Record<string, unknown>;
  }
}
