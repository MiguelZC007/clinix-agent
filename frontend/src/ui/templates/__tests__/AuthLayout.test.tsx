import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { AuthLayout } from '../AuthLayout';

describe('AuthLayout', () => {
  it('renderiza correctamente', () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('muestra logo', () => {
    render(
      <AuthLayout>
        <div>Content</div>
      </AuthLayout>
    );
    expect(screen.getByText('Clínica San Miguel')).toBeInTheDocument();
  });

  it('renderiza children correctamente', () => {
    render(
      <AuthLayout>
        <form>
          <input type="text" />
          <button>Submit</button>
        </form>
      </AuthLayout>
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
