import { describe, it, expect } from 'vitest';
import { MOCK_APPOINTMENTS } from '../__mocks__/appointments.mock';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getSpecialties,
} from '../api/appointments.api';

describe('getAppointments', () => {
  it('retorna lista de citas paginada', async () => {
    const result = await getAppointments();
    expect(result.items).toHaveLength(MOCK_APPOINTMENTS.length);
    expect(result.total).toBe(MOCK_APPOINTMENTS.length);
  });

  it('pasa parametros de filtrado', async () => {
    const result = await getAppointments({ status: 'scheduled' });
    expect(result.items.length).toBeGreaterThan(0);
  });
});

describe('getAppointmentById', () => {
  it('retorna cita por id', async () => {
    const appointment = await getAppointmentById('1');
    expect(appointment.id).toBe('1');
    expect(appointment.patientName).toBe('Juan Pérez');
  });

  it('lanza error si cita no existe', async () => {
    await expect(getAppointmentById('999')).rejects.toThrow();
  });
});

describe('createAppointment', () => {
  it('crea cita correctamente', async () => {
    const newAppointment = {
      patientId: '1',
      specialtyId: 'spec-1',
      startAppointment: '2024-12-25T10:00:00.000Z',
      endAppointment: '2024-12-25T10:30:00.000Z',
      reason: 'Consulta',
    };

    const result = await createAppointment(newAppointment);
    expect(result.reason).toBe('Consulta');
    expect(result.id).toBeDefined();
  });
});

describe('updateAppointment', () => {
  it('actualiza cita correctamente', async () => {
    const updates = {
      reason: 'Motivo actualizado',
    };

    const result = await updateAppointment('1', updates);
    expect(result.reason).toBe('Motivo actualizado');
  });
});

describe('cancelAppointment', () => {
  it('cancela cita correctamente', async () => {
    const result = await cancelAppointment('1');
    expect(result.status).toBe('cancelled');
  });
});

describe('getSpecialties', () => {
  it('retorna lista de especialidades', async () => {
    const result = await getSpecialties();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('name');
  });
});
