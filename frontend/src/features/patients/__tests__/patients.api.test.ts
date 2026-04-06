import { describe, it, expect } from 'vitest';
import { MOCK_PATIENTS } from '../__mocks__/patients.mock';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientAntecedents,
  updatePatientAntecedents,
} from '../api/patients.api';

describe('getPatients', () => {
  it('retorna lista de pacientes paginada', async () => {
    const result = await getPatients();
    expect(result.items).toHaveLength(MOCK_PATIENTS.length);
    expect(result.total).toBe(MOCK_PATIENTS.length);
    expect(result.page).toBe(1);
  });

  it('pasa parametros de paginacion', async () => {
    const result = await getPatients({ page: 1, pageSize: 5 });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
  });

  it('retorna pacientes correctamente tipados', async () => {
    const result = await getPatients();
    expect(result.items[0]).toHaveProperty('id');
    expect(result.items[0]).toHaveProperty('name');
    expect(result.items[0]).toHaveProperty('email');
  });
});

describe('getPatientById', () => {
  it('retorna paciente por id', async () => {
    const patient = await getPatientById('1');
    expect(patient.id).toBe('1');
    expect(patient.name).toBe('Juan');
  });

  it('lanza error si paciente no existe', async () => {
    await expect(getPatientById('999')).rejects.toThrow();
  });
});

describe('createPatient', () => {
  it('crea paciente correctamente', async () => {
    const newPatient = {
      name: 'Nuevo',
      lastName: 'Paciente',
      birthDate: '2000-01-01',
      gender: 'male' as const,
      phone: '+591 70000099',
      email: 'nuevo@example.com',
      address: 'Nueva Dirección',
    };

    const result = await createPatient(newPatient);
    expect(result.name).toBe('Nuevo');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
  });
});

describe('updatePatient', () => {
  it('actualiza paciente correctamente', async () => {
    const updates = {
      name: 'Juan Actualizado',
    };

    const result = await updatePatient('1', updates);
    expect(result.name).toBe('Juan Actualizado');
    expect(result.updatedAt).toBeDefined();
  });

  it('lanza error si paciente no existe', async () => {
    await expect(updatePatient('999', { name: 'Test' })).rejects.toThrow();
  });
});

describe('deletePatient', () => {
  it('elimina paciente correctamente', async () => {
    const result = await deletePatient('1');
    expect(result).toEqual({ deleted: true, id: '1' });
  });

  it('lanza error si paciente no existe', async () => {
    await expect(deletePatient('999')).rejects.toThrow();
  });
});

describe('getPatientAntecedents', () => {
  it('retorna antecedentes del paciente', async () => {
    const result = await getPatientAntecedents('1');
    expect(result.patientId).toBe('1');
    expect(Array.isArray(result.allergies)).toBe(true);
    expect(Array.isArray(result.medications)).toBe(true);
    expect(Array.isArray(result.medicalHistory)).toBe(true);
    expect(Array.isArray(result.familyHistory)).toBe(true);
    expect(result.updatedAt).toBeDefined();
  });

  it('lanza error si paciente no existe', async () => {
    await expect(getPatientAntecedents('999')).rejects.toThrow();
  });
});

describe('updatePatientAntecedents', () => {
  it('actualiza antecedentes correctamente', async () => {
    const result = await updatePatientAntecedents('1', {
      allergies: ['Penicilina', 'Polen'],
    });
    expect(result.patientId).toBe('1');
    expect(result.allergies).toContain('Penicilina');
    expect(result.allergies).toContain('Polen');
    expect(result.updatedAt).toBeDefined();
  });

  it('lanza error si paciente no existe', async () => {
    await expect(
      updatePatientAntecedents('999', { allergies: ['Polen'] })
    ).rejects.toThrow();
  });
});
