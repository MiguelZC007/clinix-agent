import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renderiza correctamente', () => {
    render(<StatusBadge status="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('aplica variante default', () => {
    render(<StatusBadge status="Status" variant="default" />);
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('aplica variante success', () => {
    render(<StatusBadge status="Success" variant="success" />);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('aplica variante warning', () => {
    render(<StatusBadge status="Warning" variant="warning" />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('aplica variante error', () => {
    render(<StatusBadge status="Error" variant="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('aplica variante info', () => {
    render(<StatusBadge status="Info" variant="info" />);
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('aplica className personalizada', () => {
    const { container } = render(<StatusBadge status="Test" className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
