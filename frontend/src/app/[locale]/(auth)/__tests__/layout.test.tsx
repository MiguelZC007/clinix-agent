import React from 'react';
import { render, screen } from '@/__tests__/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as I18nNav from '@/i18n/navigation';
import AuthLayoutPage from '../layout';

const replaceMock = vi.fn();
const useSessionMock = vi.fn();

vi.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

vi.mock('@/i18n/navigation', async () => {
  const actual = (await vi.importActual('@/i18n/navigation')) as typeof I18nNav;

  return {
    ...actual,
    useRouter: () => ({
      replace: replaceMock,
    }),
  };
});

describe('AuthLayoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el formulario incluso mientras la sesión carga', () => {
    useSessionMock.mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(
      <AuthLayoutPage>
        <div>Login form</div>
      </AuthLayoutPage>
    );

    expect(screen.getByText('Login form')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('redirige a pacientes cuando la sesión ya existe', () => {
    useSessionMock.mockReturnValue({
      data: { user: { id: '1' } },
      status: 'authenticated',
    });

    const { container } = render(
      <AuthLayoutPage>
        <div>Login form</div>
      </AuthLayoutPage>
    );

    expect(container).toBeEmptyDOMElement();
    expect(replaceMock).toHaveBeenCalledWith('/patients');
  });
});
