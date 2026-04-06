import { describe, it, expect } from 'vitest';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/login.schema';

describe('loginSchema', () => {
  const validLogin = {
    phone: '+584241234567',
    password: 'password123',
  };

  it('valida login correcto', () => {
    expect(loginSchema.parse(validLogin)).toEqual(validLogin);
  });

  it('rechaza phone vacio', () => {
    expect(() => loginSchema.parse({ ...validLogin, phone: '' })).toThrow();
  });

  it('rechaza password muy corto', () => {
    expect(() =>
      loginSchema.parse({ ...validLogin, password: '12345' })
    ).toThrow();
  });

  it('rechaza password vacio', () => {
    expect(() => loginSchema.parse({ ...validLogin, password: '' })).toThrow();
  });

  it('rechaza campos faltantes', () => {
    expect(() => loginSchema.parse({})).toThrow();
    expect(() => loginSchema.parse({ phone: '+584241234567' })).toThrow();
  });
});

describe('forgotPasswordSchema', () => {
  const validPhone = { phone: '+584241234567' };

  it('valida phone correcto', () => {
    expect(forgotPasswordSchema.parse(validPhone)).toEqual(validPhone);
  });

  it('rechaza phone vacio', () => {
    expect(() => forgotPasswordSchema.parse({ phone: '' })).toThrow();
  });

  it('rechaza campo faltante', () => {
    expect(() => forgotPasswordSchema.parse({})).toThrow();
  });
});

describe('resetPasswordSchema', () => {
  const validReset = {
    phone: '+584241234567',
    code: '123456',
    newPassword: 'newpass123',
    confirmPassword: 'newpass123',
  };

  it('valida reset correcto', () => {
    expect(resetPasswordSchema.parse(validReset)).toEqual(validReset);
  });

  it('rechaza code distinto de 6 digitos', () => {
    expect(() =>
      resetPasswordSchema.parse({ ...validReset, code: '12345' })
    ).toThrow();
    expect(() =>
      resetPasswordSchema.parse({ ...validReset, code: '1234567' })
    ).toThrow();
  });

  it('rechaza cuando contraseñas no coinciden', () => {
    expect(() =>
      resetPasswordSchema.parse({
        ...validReset,
        confirmPassword: 'otherpass123',
      })
    ).toThrow();
  });
});
