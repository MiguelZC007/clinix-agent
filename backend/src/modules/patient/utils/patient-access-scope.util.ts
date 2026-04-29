import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Role } from 'src/core/enum/role.enum';

interface AuthenticatedUserContext {
  role?: Role;
  doctor?: {
    id?: string;
  };
}

export type PatientAccessScope =
  | { role: Role.ADMIN; doctorId: null }
  | { role: Role.DOCTOR; doctorId: string };

export function resolvePatientAccessScope(user: unknown): PatientAccessScope {
  if (!user) {
    throw new UnauthorizedException('user-not-authenticated');
  }

  const context = user as AuthenticatedUserContext;

  if (context.role === Role.ADMIN) {
    return {
      role: Role.ADMIN,
      doctorId: null,
    };
  }

  if (context.role === Role.DOCTOR) {
    const doctorId = context.doctor?.id;

    if (!doctorId) {
      throw new UnauthorizedException('user-doctor-context-missing');
    }

    return {
      role: Role.DOCTOR,
      doctorId,
    };
  }

  throw new ForbiddenException('user-not-authorized');
}
