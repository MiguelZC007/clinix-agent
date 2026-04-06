// Test data fixtures for E2E tests

export const mockDoctor = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'John',
  lastName: 'Doe',
  fullName: 'Dr. John Doe',
  email: 'john.doe@clinix.com',
  phone: '+549111234567',
  specialty: 'Cardiología', // Must match a specialty from the database
  specialtyId: '', // Will be filled by API
  licenseNumber: 'MN12345',
  status: 'active',
  createdAt: new Date().toISOString(),
};

export const mockPatient = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Juan',
  lastName: 'Pérez',
  fullName: 'Juan Pérez',
  email: 'juan.perez@email.com',
  phone: '+5491198765432',
  birthDate: '1985-06-15',
  gender: 'male',
  address: 'Av. Corrientes 1234, Buenos Aires',
  status: 'active',
};

export const mockClinicalHistory = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  patientId: '123e4567-e89b-12d3-a456-426614174001',
  doctorId: '123e4567-e89b-12d3-a456-426614174000',
  date: new Date().toISOString(),
  reason: 'Checkup rutinario',
  diagnosis: 'Hipertensión controlada',
  treatment: 'Continuar con Enalapril',
  notes: 'Paciente estable',
  vitalSigns: {
    bloodPressure: '120/80',
    heartRate: 72,
    temperature: 36.5,
    weight: 75,
    height: 175,
  },
};

export const mockAppointment = {
  id: '123e4567-e89b-12d3-a456-426614174003',
  patientId: '123e4567-e89b-12d3-a456-426614174001',
  doctorId: '123e4567-e89b-12d3-a456-426614174000',
  date: new Date().toISOString().split('T')[0],
  time: '10:00',
  status: 'scheduled',
  reason: 'Consulta general',
  notes: '',
};

// Factory functions
export const createMockDoctor = (overrides = {}) => {
  const timestamp = Date.now();
  return {
    ...mockDoctor,
    id: `doctor-${timestamp}`,
    name: `Doctor${timestamp}`,
    lastName: `Test${timestamp}`,
    fullName: `Dr. Test ${timestamp}`,
    licenseNumber: `MN${timestamp.toString().slice(-6)}`,
    password: 'Password123!',
    ...overrides,
  };
};

export const createMockPatient = (overrides = {}) => ({
  ...mockPatient,
  id: `patient-${Date.now()}`,
  email: `patient-${Date.now()}@email.com`,
  ...overrides,
});

export const createMockDoctors = (count: number) =>
  Array.from({ length: count }, (_, i) => createMockDoctor({
    id: `doctor-${i}`,
    name: `Dr. Test ${i}`,
    email: `test${i}@clinix.com`,
  }));

export const createMockPatients = (count: number) =>
  Array.from({ length: count }, (_, i) => createMockPatient({
    id: `patient-${i}`,
    firstName: `Patient${i}`,
    lastName: `Test${i}`,
    email: `patient${i}@email.com`,
  }));