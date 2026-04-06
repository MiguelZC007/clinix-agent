export type { AppointmentStatus } from '../schemas/appointment.schema';
import type { AppointmentStatus } from '../schemas/appointment.schema';

export interface AppointmentBackendPatient {
  id: string;
  name: string;
  lastName: string;
}

export interface AppointmentBackendDoctor {
  id: string;
  name: string;
  lastName: string;
  specialty?: string;
}

export interface AppointmentBackend {
  id: string;
  patientId: string;
  doctorId?: string;
  specialtyId?: string;
  startAppointment: string;
  endAppointment: string;
  reason: string;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'CONFIRMED' | AppointmentStatus;
  patient: AppointmentBackendPatient;
  doctor?: AppointmentBackendDoctor;
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientInitials: string;
  date: Date;
  startTime: string;
  endTime: string;
  reason: string;
  status: AppointmentStatus;
  doctorId?: string;
  specialtyId?: string;
  doctor?: AppointmentBackendDoctor;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateAppointmentRequest = {
  patientId: string;
  specialtyId: string;
  startAppointment: string;
  endAppointment: string;
  reason: string;
};

export type UpdateAppointmentRequest = {
  startAppointment?: string;
  endAppointment?: string;
  reason?: string;
};

export interface Specialty {
  id: string;
  name: string;
}

export type AppointmentsListParams = {
  page?: number;
  limit?: number;
  pageSize?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AppointmentStatus;
};

export type CalendarView = 'day' | 'week' | 'month';
