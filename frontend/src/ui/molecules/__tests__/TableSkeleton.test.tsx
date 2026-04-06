import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { TableSkeleton } from '../TableSkeleton';

describe('TableSkeleton', () => {
  it('renderiza correctamente', () => {
    render(<TableSkeleton columns={3} />);
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });

  it('renderiza numero correcto de columnas', () => {
    render(<TableSkeleton columns={5} />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(5);
  });

  it('renderiza 5 filas por defecto', () => {
    render(<TableSkeleton columns={3} />);
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it('renderiza numero personalizado de filas', () => {
    render(<TableSkeleton columns={3} rows={10} />);
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThanOrEqual(10);
  });

  it('renderiza skeletons en cada celda', () => {
    render(<TableSkeleton columns={2} rows={2} />);
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
