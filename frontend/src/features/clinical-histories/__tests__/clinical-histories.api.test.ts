import { describe, it, expect } from 'vitest';
import { MOCK_CLINICAL_HISTORIES } from '../__mocks__/clinical-histories.mock';
import {
  getClinicalHistories,
  getClinicalHistoryById,
  createClinicalHistory,
} from '../api/clinical-histories.api';

describe('getClinicalHistories', () => {
  it('retorna lista de historiales paginada', async () => {
    const result = await getClinicalHistories();
    expect(result.items).toHaveLength(MOCK_CLINICAL_HISTORIES.length);
    expect(result.total).toBe(MOCK_CLINICAL_HISTORIES.length);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('retorna página solicitada con page y pageSize', async () => {
    const result = await getClinicalHistories({ page: 1, pageSize: 1 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(MOCK_CLINICAL_HISTORIES.length);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(1);
    expect(result.totalPages).toBe(2);
  });

  it('filtra por patientId', async () => {
    const result = await getClinicalHistories({ patientId: '1' });
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('acepta search, dateFrom y dateTo en params', async () => {
    const result = await getClinicalHistories({
      page: 1,
      pageSize: 10,
      search: 'dolor',
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
    });
    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('page', 1);
    expect(result).toHaveProperty('pageSize', 10);
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('totalPages');
  });
});

describe('getClinicalHistoryById', () => {
  it('retorna historial por id', async () => {
    const history = await getClinicalHistoryById('1');
    expect(history.id).toBe('1');
    expect(history.reason).toBeDefined();
  });

  it('lanza error si historial no existe', async () => {
    await expect(getClinicalHistoryById('999')).rejects.toThrow();
  });
});

describe('createClinicalHistory', () => {
  it('crea historial correctamente', async () => {
    const newHistory = {
      appointmentId: '550e8400-e29b-41d4-a716-446655440003',
      consultationReason: 'Nueva consulta de control',
      symptoms: ['Dolor de cabeza'],
      treatment: 'Analgésicos y reposo',
      diagnostics: [{ name: 'Migraña', description: 'Cefalea tensional' }],
      physicalExams: [{ name: 'Examen físico', description: 'Normal' }],
      vitalSigns: [
        { name: 'Presión arterial', value: '120/80', unit: 'mmHg', measurement: 'sistólica/diastólica' },
        { name: 'Frecuencia cardíaca', value: '72', unit: 'lpm', measurement: 'pulsos' },
        { name: 'Temperatura', value: '36.5', unit: '°C', measurement: 'axilar' },
        { name: 'Peso', value: '70', unit: 'kg', measurement: 'peso corporal' },
        { name: 'Altura', value: '170', unit: 'cm', measurement: 'talla' },
      ],
    };

    const result = await createClinicalHistory(newHistory);
    expect(result.reason).toBe('Nueva consulta de control');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
  });
});
