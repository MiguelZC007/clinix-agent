import { UnauthorizedException } from '@nestjs/common';
import { Role } from 'src/core/enum/role.enum';
import {
  resolvePatientAccessScope,
  type PatientAccessScope,
} from './patient-access-scope.util';

describe('resolvePatientAccessScope', () => {
  it('debe devolver alcance de ADMIN con doctorId en null', () => {
    const scope = resolvePatientAccessScope({
      role: Role.ADMIN,
      doctor: { id: 'doctor-should-be-ignored' },
    });

    const expected: PatientAccessScope = { role: Role.ADMIN, doctorId: null };
    expect(scope).toEqual(expected);
  });

  it('debe devolver alcance de DOCTOR con doctorId obligatorio', () => {
    const scope = resolvePatientAccessScope({
      role: Role.DOCTOR,
      doctor: { id: 'doctor-uuid' },
    });

    const expected: PatientAccessScope = {
      role: Role.DOCTOR,
      doctorId: 'doctor-uuid',
    };
    expect(scope).toEqual(expected);
  });

  it('debe lanzar error con usuario inconsistente para DOCTOR sin doctorId', () => {
    expect(() =>
      resolvePatientAccessScope({
        role: Role.DOCTOR,
      }),
    ).toThrow(UnauthorizedException);
  });
});
