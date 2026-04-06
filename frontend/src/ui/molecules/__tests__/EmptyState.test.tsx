import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renderiza correctamente', () => {
    render(
      <EmptyState
        type="patients"
        title="No hay pacientes"
        description="Comienza agregando tu primer paciente"
      />
    );
    expect(screen.getByText('No hay pacientes')).toBeInTheDocument();
    expect(
      screen.getByText('Comienza agregando tu primer paciente')
    ).toBeInTheDocument();
  });

  it('muestra boton de accion cuando se proporciona', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        type="patients"
        title="No hay pacientes"
        description="Descripción"
        actionLabel="Agregar paciente"
        onAction={onAction}
      />
    );
    const button = screen.getByRole('button', { name: 'Agregar paciente' });
    expect(button).toBeInTheDocument();
  });

  it('llama onAction al hacer click', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <EmptyState
        type="patients"
        title="No hay pacientes"
        description="Descripción"
        actionLabel="Agregar paciente"
        onAction={onAction}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('no muestra boton cuando no hay onAction', () => {
    render(
      <EmptyState
        type="patients"
        title="No hay pacientes"
        description="Descripción"
      />
    );
    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });
});
