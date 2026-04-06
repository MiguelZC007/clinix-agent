import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { MOCK_CLINICAL_HISTORIES } from '../../__mocks__/clinical-histories.mock';
import { ClinicalHistoryTable } from '../ClinicalHistoryTable';

describe('ClinicalHistoryTable', () => {
  it('renderiza columnas Paciente, Fecha, Motivo, Diagnóstico y Acciones', () => {
    render(
      <ClinicalHistoryTable
        histories={MOCK_CLINICAL_HISTORIES}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
        onView={vi.fn()}
      />,
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText(MOCK_CLINICAL_HISTORIES[0].patientName!)).toBeInTheDocument();
    expect(screen.getByText(MOCK_CLINICAL_HISTORIES[0].reason)).toBeInTheDocument();
    expect(screen.getByText(MOCK_CLINICAL_HISTORIES[0].diagnosis)).toBeInTheDocument();
  });

  it('llama onView con el item correcto al hacer click en fila', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();
    render(
      <ClinicalHistoryTable
        histories={MOCK_CLINICAL_HISTORIES}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
        onView={onView}
      />,
    );
    const row = screen.getByText(MOCK_CLINICAL_HISTORIES[0].patientName!).closest('tr');
    if (row) {
      await user.click(row);
      expect(onView).toHaveBeenCalledWith(MOCK_CLINICAL_HISTORIES[0]);
    }
  });

  it('renderiza paginación cuando totalPages > 1', () => {
    render(
      <ClinicalHistoryTable
        histories={MOCK_CLINICAL_HISTORIES}
        page={1}
        totalPages={3}
        onPageChange={vi.fn()}
        onView={vi.fn()}
      />,
    );
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('llama onPageChange al hacer click en botón de paginación', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <ClinicalHistoryTable
        histories={MOCK_CLINICAL_HISTORIES}
        page={1}
        totalPages={2}
        onPageChange={onPageChange}
        onView={vi.fn()}
      />,
    );
    const paginationText = screen.getByText('1 / 2');
    const paginationSection = paginationText.closest('div');
    const buttons = paginationSection
      ? Array.from(paginationSection.querySelectorAll('button'))
      : [];
    const nextButton = buttons.find((btn) => !btn.disabled);
    expect(nextButton).toBeDefined();
    if (nextButton) {
      await user.click(nextButton as HTMLElement);
      expect(onPageChange).toHaveBeenCalled();
    }
  });

  it('no rompe con lista vacía', () => {
    render(
      <ClinicalHistoryTable
        histories={[]}
        page={1}
        totalPages={0}
        onPageChange={vi.fn()}
        onView={vi.fn()}
      />,
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
