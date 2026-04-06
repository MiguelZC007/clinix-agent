import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { Logo } from '../Logo';

describe('Logo', () => {
  it('renderiza correctamente', () => {
    render(<Logo />);
    const logo = screen.getByText('Clínica San Miguel');
    expect(logo).toBeInTheDocument();
  });

  it('muestra texto por defecto', () => {
    render(<Logo />);
    expect(screen.getByText('Clínica San Miguel')).toBeInTheDocument();
  });

  it('oculta texto cuando showText es false', () => {
    render(<Logo showText={false} />);
    expect(screen.queryByText('Clínica San Miguel')).not.toBeInTheDocument();
  });

  it('aplica tamaño pequeño', () => {
    render(<Logo size="sm" />);
    const logo = screen.getByText('Clínica San Miguel');
    expect(logo).toBeInTheDocument();
  });

  it('aplica tamaño mediano', () => {
    render(<Logo size="md" />);
    const logo = screen.getByText('Clínica San Miguel');
    expect(logo).toBeInTheDocument();
  });

  it('aplica tamaño grande', () => {
    render(<Logo size="lg" />);
    const logo = screen.getByText('Clínica San Miguel');
    expect(logo).toBeInTheDocument();
  });

  it('aplica className personalizada', () => {
    const { container } = render(<Logo className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
