import type { AppointmentStatus } from '../schemas/appointment.schema';
import type { Appointment, AppointmentBackend } from '../types/appointment.types';

function getInitials(name: string, lastName: string): string {
  const firstInitial = name.charAt(0).toUpperCase();
  const lastInitial = lastName.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
}

function mapStatus(status: AppointmentBackend['status']): AppointmentStatus {
  if (status === 'PENDING') return 'pending';
  if (status === 'SCHEDULED') return 'scheduled';
  if (status === 'COMPLETED') return 'completed';
  if (status === 'CANCELLED') return 'cancelled';
  if (status === 'CONFIRMED') return 'confirmed';
  return status;
}

export function mapAppointmentFromBackend(data: AppointmentBackend | null | undefined): Appointment {
  if (!data) {
    const now = new Date();
    return {
      id: '',
      patientId: '',
      patientName: '',
      patientInitials: '',
      date: now,
      startTime: '00:00',
      endTime: '00:00',
      reason: '',
      status: 'pending',
    };
  }
  
  const startDate = new Date(data.startAppointment);
  const endDate = new Date(data.endAppointment);
  
  const date = isNaN(startDate.getTime()) ? new Date() : new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  
  const formatTime = (date: Date): string => {
    if (isNaN(date.getTime())) return '00:00';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  const startTime = formatTime(startDate);
  const endTime = formatTime(endDate);
  
  const patientName = data.patient?.name && data.patient?.lastName
    ? `${data.patient.name} ${data.patient.lastName}`
    : '';
  const patientInitials = data.patient?.name && data.patient?.lastName
    ? getInitials(data.patient.name, data.patient.lastName)
    : '';
  
  return {
    id: data.id || '',
    patientId: data.patientId || data.patient?.id || '',
    patientName,
    patientInitials,
    date,
    startTime,
    endTime,
    reason: data.reason || '',
    status: mapStatus(data.status),
    doctorId: data.doctorId,
    specialtyId: data.specialtyId,
    doctor: data.doctor,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}
