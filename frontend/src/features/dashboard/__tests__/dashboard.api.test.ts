import { describe, it, expect } from 'vitest';
import { MOCK_APPOINTMENTS } from '@/features/appointments/__mocks__/appointments.mock';
import { MOCK_CLINICAL_HISTORIES } from '@/features/clinical-histories/__mocks__/clinical-histories.mock';
import { MOCK_PATIENTS } from '@/features/patients/__mocks__/patients.mock';
import { getDashboardSummary } from '../api/dashboard.api';

describe('getDashboardSummary', () => {
  it('retorna resumen con estadísticas y últimas consultas', async () => {
    const result = await getDashboardSummary();
    expect(result.patientsCount).toBe(MOCK_PATIENTS.length);
    expect(result.appointmentsThisWeek).toBe(MOCK_APPOINTMENTS.length);
    expect(result.totalHistories).toBe(MOCK_CLINICAL_HISTORIES.length);
    expect(result.consultationsToday).toBe(0);
    expect(Array.isArray(result.recentConsultations)).toBe(true);
    expect(result.recentConsultations.length).toBeLessThanOrEqual(5);
  });

  it('retorna recentConsultations con id, patientName, patientLastName, consultationReason, createdAt', async () => {
    const result = await getDashboardSummary();
    if (result.recentConsultations.length > 0) {
      const first = result.recentConsultations[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('patientName');
      expect(first).toHaveProperty('patientLastName');
      expect(first).toHaveProperty('consultationReason');
      expect(first).toHaveProperty('createdAt');
    }
  });
});
