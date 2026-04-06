import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { MOCK_CLINICAL_HISTORIES } from '../../__mocks__/clinical-histories.mock';
import { ClinicalHistoryDetail } from '../ClinicalHistoryDetail';

describe('ClinicalHistoryDetail', () => {
  it('renderiza correctamente', () => {
    render(<ClinicalHistoryDetail history={MOCK_CLINICAL_HISTORIES[0]} />);
    expect(screen.getByText(MOCK_CLINICAL_HISTORIES[0].reason)).toBeInTheDocument();
  });

  it('muestra todas las secciones', () => {
    render(<ClinicalHistoryDetail history={MOCK_CLINICAL_HISTORIES[0]} />);
    expect(screen.getByText(MOCK_CLINICAL_HISTORIES[0].symptoms)).toBeInTheDocument();
    expect(screen.getByText(MOCK_CLINICAL_HISTORIES[0].diagnosis)).toBeInTheDocument();
  });

  it('muestra vital signs card', () => {
    render(<ClinicalHistoryDetail history={MOCK_CLINICAL_HISTORIES[0]} />);
    expect(screen.getByText(MOCK_CLINICAL_HISTORIES[0].vitalSigns.bloodPressure)).toBeInTheDocument();
  });
});
