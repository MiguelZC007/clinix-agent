import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { LoginForm } from '../LoginForm';

describe('LoginForm', () => {
  it('renderiza formulario correctamente', () => {
    render(<LoginForm />);
    expect(screen.getByText(/auth\.phone|phone|teléfono/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login|iniciar sesión|auth\.login/i })).toBeInTheDocument();
    const passwordField = screen.getByLabelText(/password|contraseña|auth\.password/i);
    expect(passwordField).toBeInTheDocument();
  });

  it('muestra errores de validacion', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /login|iniciar sesión|auth\.login/i });
    await user.click(submitButton);

    const passwordInput = screen.getByLabelText(/password|contraseña|auth\.password/i);
    expect(passwordInput).toBeInvalid();
  });

  it('valida longitud minima de password', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/password|contraseña|auth\.password/i);
    await user.type(passwordInput, '12345');

    const submitButton = screen.getByRole('button', { name: /login|iniciar sesión|auth\.login/i });
    await user.click(submitButton);

    expect(passwordInput).toBeInvalid();
  });

  it('muestra link de forgot password', () => {
    render(<LoginForm />);
    const link = screen.getByRole('link', { name: /forgotPassword|olvidaste tu contraseña/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toContain('forgot-password');
  });
});
