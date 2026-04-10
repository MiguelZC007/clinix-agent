import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { MOCK_CLINICAL_HISTORY_LIST_ITEMS } from '../../__mocks__/clinical-histories.mock';
import { ClinicalHistoryCard } from '../ClinicalHistoryCard';

describe('ClinicalHistoryCard', () => {
  it('renderiza correctamente', () => {
    render(<ClinicalHistoryCard history={MOCK_CLINICAL_HISTORY_LIST_ITEMS[0]} />);
    expect(screen.getByText(MOCK_CLINICAL_HISTORY_LIST_ITEMS[0].patientName!)).toBeInTheDocument();
  });

  it('muestra informacion resumen del historial', () => {
    render(<ClinicalHistoryCard history={MOCK_CLINICAL_HISTORY_LIST_ITEMS[0]} />);
    expect(screen.getByText(MOCK_CLINICAL_HISTORY_LIST_ITEMS[0].patientName!)).toBeInTheDocument();
    expect(screen.getByText(MOCK_CLINICAL_HISTORY_LIST_ITEMS[0].reason)).toBeInTheDocument();
    expect(screen.getByText(/María González/)).toBeInTheDocument();
  });

  it('llama onClick cuando se proporciona', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ClinicalHistoryCard history={MOCK_CLINICAL_HISTORY_LIST_ITEMS[0]} onClick={onClick} />);

    const card = screen.getByText(MOCK_CLINICAL_HISTORY_LIST_ITEMS[0].patientName!).closest('div');
    if (card) {
      await user.click(card);
      expect(onClick).toHaveBeenCalledTimes(1);
    }
  });
});
