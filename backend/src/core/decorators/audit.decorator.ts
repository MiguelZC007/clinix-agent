import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '../interceptors/audit.interceptor';

export const AUDIT_METADATA_KEY = 'audit:config';

export interface AuditDecoratorOptions {
  action: string;
  entityType: string;
  entityIdParam?: string;
}

export const Audit = (options: AuditDecoratorOptions) =>
  applyDecorators(
    SetMetadata(AUDIT_METADATA_KEY, options),
    UseInterceptors(AuditInterceptor),
  );
