import type { ClinicalHistory } from '../types/clinical-history.types';

export const MOCK_CLINICAL_HISTORIES: ClinicalHistory[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'Juan Pérez',
    reason: 'Dolor abdominal persistente desde hace 3 días',
    symptoms: 'Dolor en zona epigástrica, náuseas ocasionales',
    physicalExam: 'Abdomen blando, dolor a la palpación en epigastrio',
    diagnosis: 'Gastritis aguda',
    treatment: 'Omeprazol 20mg cada 12 horas por 14 días. Dieta blanda.',
    notes: 'Control en 2 semanas',
    vitalSigns: {
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 36.5,
      weight: 75,
      height: 175,
    },
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: '2',
    patientId: '2',
    patientName: 'María González',
    reason: 'Control rutinario',
    symptoms: 'Sin síntomas actuales',
    physicalExam: 'Examen físico normal',
    diagnosis: 'Paciente sana',
    treatment: 'Continuar con estilo de vida saludable',
    notes: 'Próximo control en 6 meses',
    vitalSigns: {
      bloodPressure: '110/70',
      heartRate: 68,
      temperature: 36.2,
      weight: 62,
      height: 165,
    },
    createdAt: '2024-01-18T14:30:00Z',
    updatedAt: '2024-01-18T14:30:00Z',
  },
];

export function getMockClinicalHistoryById(id: string): ClinicalHistory | undefined {
  return MOCK_CLINICAL_HISTORIES.find((history) => history.id === id);
}

export function getMockClinicalHistoriesByPatientId(patientId: string): ClinicalHistory[] {
  return MOCK_CLINICAL_HISTORIES.filter((history) => history.patientId === patientId);
}
