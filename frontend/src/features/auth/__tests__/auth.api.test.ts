import { describe, it, expect } from 'vitest';
import { login, forgotPassword, resetPassword, logout } from '../api/auth.api';

describe('login', () => {
  it('inicia sesion con credenciales validas', async () => {
    const result = await login({
      phone: '+584241234567',
      password: 'password123',
    });

    expect(result.user).toBeDefined();
    expect(result.user.phone).toBe('+584241234567');
    expect(result.accessToken).toBeDefined();
  });

  it('lanza error con credenciales invalidas', async () => {
    await expect(
      login({
        phone: '+584241234567',
        password: 'wrongpassword',
      })
    ).rejects.toThrow();
  });
});

describe('forgotPassword', () => {
  it('envia codigo OTP por WhatsApp', async () => {
    const result = await forgotPassword({ phone: '+584241234567' });
    expect(result.message).toBeDefined();
  });
});

describe('resetPassword', () => {
  it('resetea contraseña correctamente', async () => {
    const result = await resetPassword({
      phone: '+584241234567',
      code: '123456',
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123',
    });
    expect(result.message).toBeDefined();
  });
});

describe('logout', () => {
  it('cierra sesion correctamente', async () => {
    await expect(logout()).resolves.not.toThrow();
  });
});
