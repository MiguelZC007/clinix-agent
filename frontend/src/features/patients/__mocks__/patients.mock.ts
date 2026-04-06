import type { Patient } from '../types/patient.types';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    email: 'juan.perez@email.com',
    name: 'Juan',
    lastName: 'Pérez',
    phone: '+591 70000001',
    address: 'Av. Principal 123',
    birthDate: '1990-05-15',
    gender: 'male',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    email: 'maria.gonzalez@email.com',
    name: 'María',
    lastName: 'González',
    phone: '+591 70000002',
    address: 'Calle Secundaria 456',
    birthDate: '1985-08-22',
    gender: 'female',
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
  {
    id: '3',
    email: 'carlos.lopez@email.com',
    name: 'Carlos',
    lastName: 'López',
    phone: '+591 70000003',
    address: 'Calle Tercera 789',
    birthDate: '1978-03-10',
    gender: 'male',
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z',
  },
];

export function getMockPatientById(id: string): Patient | undefined {
  return MOCK_PATIENTS.find((patient) => patient.id === id);
}
