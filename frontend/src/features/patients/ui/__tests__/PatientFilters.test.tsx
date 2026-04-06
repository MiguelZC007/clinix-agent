import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { PatientFilters } from '../PatientFilters';

describe('PatientFilters', () => {
  it('renderiza correctamente', () => {
    render(<PatientFilters search="" onSearchChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('muestra valor inicial', () => {
    render(<PatientFilters search="test" onSearchChange={vi.fn()} />);
    expect(screen.getByDisplayValue('test')).toBeInTheDocument();
  });

  it('llama onSearchChange al cambiar valor', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(<PatientFilters search="" onSearchChange={onSearchChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');

    expect(onSearchChange).toHaveBeenCalled();
  });
});
