import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { MOCK_CLINICAL_HISTORIES } from '../../__mocks__/clinical-histories.mock';
import { VitalSignsCard } from '../VitalSignsCard';

describe('VitalSignsCard', () => {
  it('renderiza correctamente', () => {
    render(<VitalSignsCard vitalSigns={MOCK_CLINICAL_HISTORIES[0].vitalSigns} />);
    expect(screen.getByText(MOCK_CLINICAL_HISTORIES[0].vitalSigns.bloodPressure)).toBeInTheDocument();
  });

  it('muestra todos los signos vitales', () => {
    const vitalSigns = MOCK_CLINICAL_HISTORIES[0].vitalSigns;
    render(<VitalSignsCard vitalSigns={vitalSigns} />);

    expect(screen.getByText(vitalSigns.bloodPressure)).toBeInTheDocument();
    expect(screen.getByText(vitalSigns.heartRate)).toBeInTheDocument();
    expect(screen.getByText(vitalSigns.temperature)).toBeInTheDocument();
    expect(screen.getByText(vitalSigns.weight)).toBeInTheDocument();
    expect(screen.getByText(vitalSigns.height)).toBeInTheDocument();
  });
});
