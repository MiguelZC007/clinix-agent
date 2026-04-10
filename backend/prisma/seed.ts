import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const specialties = [
  'Cardiología',
  'Dermatología',
  'Endocrinología',
  'Gastroenterología',
  'Neurología',
  'Oncología',
  'Oftalmología',
  'Ortopedia',
  'Pediatría',
  'Psiquiatría',
];

const firstNames = [
  'María', 'José', 'Ana', 'Luis', 'Carmen', 'Juan', 'Laura', 'Carlos',
  'Patricia', 'Miguel', 'Sofía', 'Roberto', 'Isabel', 'Fernando', 'Elena',
  'Diego', 'Lucía', 'Antonio', 'Marta', 'Francisco', 'Andrea', 'Manuel',
  'Paula', 'Javier', 'Cristina', 'Álvaro', 'Natalia', 'Sergio', 'Raquel',
  'Pablo', 'Beatriz', 'David', 'Mónica', 'Jorge', 'Silvia', 'Rubén',
  'Teresa', 'Óscar', 'Inés', 'Víctor', 'Clara', 'Iván', 'Eva', 'Adrián',
  'Rosa', 'Eduardo', 'Alicia', 'Ricardo', 'Julia', 'Alberto', 'Diana',
];

const lastNames = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez',
  'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández',
  'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
  'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez',
  'Serrano', 'Blanco', 'Suárez', 'Molina', 'Morales', 'Ortega', 'Delgado',
  'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Núñez', 'Iglesias', 'Medina',
  'Garrido', 'Cortés', 'Castillo', 'Lozano', 'Guerrero', 'Cano', 'Prieto',
  'Méndez', 'Cruz', 'Calvo', 'Vidal', 'León', 'Herrera', 'Márquez',
];

const doctorFirstNames = [
  'Dr. Carlos', 'Dra. María', 'Dr. Javier', 'Dra. Ana', 'Dr. Luis',
  'Dra. Carmen', 'Dr. Roberto', 'Dra. Laura', 'Dr. Fernando', 'Dra. Patricia',
];

const doctorLastNames = [
  'Mendoza', 'Vargas', 'Silva', 'Morales', 'Herrera',
  'Castro', 'Ramos', 'Ortega', 'Delgado', 'Torres',
];

const allergies = [
  'Penicilina',
  'Sulfas',
  'Aspirina',
  'Ibuprofeno',
  'Polen',
  'Ácaros',
  'Maní',
  'Mariscos',
  'Lactosa',
  'Huevos',
  'Ninguna',
];

const medications = [
  'Metformina',
  'Losartán',
  'Atorvastatina',
  'Omeprazol',
  'Levotiroxina',
  'Amlodipino',
  'Metoprolol',
  'Furosemida',
  'Warfarina',
  'Insulina',
  'Ninguna',
];

const medicalHistory = [
  'Hipertensión',
  'Diabetes tipo 2',
  'Asma',
  'Artritis',
  'Osteoporosis',
  'Enfermedad cardíaca',
  'Colesterol alto',
  'Reflujo gastroesofágico',
  'Hipotiroidismo',
  'Ninguna',
];

const familyHistory = [
  'Diabetes',
  'Hipertensión',
  'Cáncer',
  'Enfermedad cardíaca',
  'Asma',
  'Artritis',
  'Alzheimer',
  'Ninguna',
];

const consultationReasons = [
  'Control de rutina',
  'Dolor de cabeza persistente',
  'Dolor en el pecho',
  'Dificultad para respirar',
  'Dolor abdominal',
  'Fiebre y malestar general',
  'Problemas de visión',
  'Dolor en las articulaciones',
  'Ansiedad y estrés',
  'Control de presión arterial',
  'Revisión de resultados de laboratorio',
  'Seguimiento de tratamiento',
];

const symptoms = [
  'Dolor de cabeza',
  'Fiebre',
  'Náuseas',
  'Mareos',
  'Fatiga',
  'Dolor en el pecho',
  'Dificultad para respirar',
  'Dolor abdominal',
  'Tos',
  'Dolor en las articulaciones',
  'Visión borrosa',
  'Ansiedad',
];

const diagnosticNames = [
  'Hipertensión arterial',
  'Diabetes mellitus tipo 2',
  'Resfriado común',
  'Gripe',
  'Gastritis',
  'Migraña',
  'Ansiedad generalizada',
  'Artritis reumatoide',
  'Asma bronquial',
  'Hipertiroidismo',
];

const physicalExamNames = [
  'Examen físico general',
  'Auscultación cardíaca',
  'Auscultación pulmonar',
  'Palpación abdominal',
  'Examen neurológico',
  'Examen oftalmológico',
  'Examen de articulaciones',
  'Medición de presión arterial',
];

const vitalSignNames = [
  'Presión arterial',
  'Temperatura',
  'Frecuencia cardíaca',
  'Frecuencia respiratoria',
  'Saturación de oxígeno',
  'Peso',
  'Altura',
  'Índice de masa corporal',
];

const medicationNames = [
  'Paracetamol',
  'Ibuprofeno',
  'Amoxicilina',
  'Omeprazol',
  'Losartán',
  'Metformina',
  'Atorvastatina',
  'Levotiroxina',
];

const TEST_DOCTOR_PHONES = ['+59160365521', '+59177484885'] as const;

const DEMO_PATIENT_COUNT = 100;

const DEMO_APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateSeedDoctorPhone(index: number): string {
  return `+5802${String(10_000_000 + index).slice(-8)}`;
}

function generateSeedPatientEmail(index: number): string {
  return `seed.patient${index + 1}@example.com`;
}

function generateSeedPatientPhone(index: number): string {
  return `+5804${String(10_000_000 + index).slice(-8)}`;
}

function normalizeForEmail(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '');
}

function generateEmail(name: string, lastName: string, index: number): string {
  const cleanName = normalizeForEmail(name);
  const cleanLastName = normalizeForEmail(lastName);
  return `${cleanName}.${cleanLastName}${index}@example.com`;
}

function generateBirthDate(): Date {
  const start = new Date(1950, 0, 1);
  const end = new Date(2010, 11, 31);
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

async function ensureSeedUser({
  email,
  name,
  lastName,
  phone,
  password,
  role,
}: {
  email: string;
  name: string;
  lastName: string;
  phone: string;
  password: string;
  role: 'ADMIN' | 'DOCTOR' | 'PATIENT';
}) {
  const existingUserByEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUserByEmail) {
    return prisma.user.update({
      where: { id: existingUserByEmail.id },
      data: {
        email,
        name,
        lastName,
        phone,
        password,
        role,
      },
    });
  }

  const existingUserByPhone = await prisma.user.findUnique({
    where: { phone },
  });

  if (existingUserByPhone) {
    return prisma.user.update({
      where: { id: existingUserByPhone.id },
      data: {
        email,
        name,
        lastName,
        phone,
        password,
        role,
      },
    });
  }

  return prisma.user.create({
    data: {
      email,
      name,
      lastName,
      phone,
      password,
      role,
    },
  });
}

async function ensureSpecialty(name: string) {
  const existingSpecialty = await prisma.specialty.findFirst({
    where: { name },
    orderBy: { createdAt: 'asc' },
  });

  if (existingSpecialty) {
    return existingSpecialty;
  }

  return prisma.specialty.create({
    data: { name },
  });
}

async function ensureDoctorProfile({
  userId,
  specialtyId,
  licenseNumber,
}: {
  userId: string;
  specialtyId: string;
  licenseNumber: string;
}) {
  return prisma.doctor.upsert({
    where: { userId },
    create: {
      userId,
      specialtyId,
      licenseNumber,
    },
    update: {
      specialtyId,
      licenseNumber,
    },
  });
}

function generateAppointmentDate(baseDate: Date, daysOffset: number, slotSeed: number): Date {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + daysOffset);
  const hour = 8 + (slotSeed % 10);
  const minute = slotSeed % 2 === 0 ? 0 : 30;
  date.setHours(hour, minute, 0, 0);
  return date;
}

function getRandomElements<T>(array: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateAntecedents() {
  return {
    allergies: getRandomElements(allergies, 0, 3).filter(a => a !== 'Ninguna'),
    medications: getRandomElements(medications, 0, 3).filter(m => m !== 'Ninguna'),
    medicalHistory: getRandomElements(medicalHistory, 0, 2).filter(h => h !== 'Ninguna'),
    familyHistory: getRandomElements(familyHistory, 0, 3).filter(f => f !== 'Ninguna'),
  };
}

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // ===========================================
  // TEST CREDENTIALS FOR E2E TESTING
  // See: frontend/e2e/TEST_CREDENTIALS.md
  // ===========================================
  
  const TEST_CREDENTIALS = {
    admin: {
      email: 'admin@clinix.com',
      phone: '+59170000001',
      password: 'Admin123!',
      role: 'ADMIN' as const,
    },
    doctor: {
      email: 'doctor.test@clinix.com',
      phone: '+59170000002',
      password: 'Doctor123!',
      role: 'DOCTOR' as const,
    },
    patient: {
      email: 'patient.test@clinix.com',
      phone: '+59170000003',
      password: 'Patient123!',
      role: 'PATIENT' as const,
    },
    e2e: {
      email: 'test-e2e@clinix.local',
      phone: '+59170000000',
      password: 'Test123!',
      role: 'DOCTOR' as const,
    },
  };

  const hashedPassword = await bcrypt.hash('password123', 10);
  const testPasswordHash = await bcrypt.hash(TEST_CREDENTIALS.e2e.password, 10);
  const adminPasswordHash = await bcrypt.hash(TEST_CREDENTIALS.admin.password, 10);
  const doctorPasswordHash = await bcrypt.hash(TEST_CREDENTIALS.doctor.password, 10);
  const patientPasswordHash = await bcrypt.hash(TEST_CREDENTIALS.patient.password, 10);

  console.log('📋 Asegurando especialidades base...');
  const createdSpecialties = await Promise.all(
    specialties.map((name) => ensureSpecialty(name)),
  );
  console.log(`✅ ${createdSpecialties.length} especialidades listas`);

  // ===========================================
  // E2E TEST USER (for Playwright tests)
  // ===========================================
  console.log('🔐 Creando usuario de prueba E2E...');
  const e2eUser = await ensureSeedUser({
    email: TEST_CREDENTIALS.e2e.email,
    name: 'E2E',
    lastName: 'Test Doctor',
    phone: TEST_CREDENTIALS.e2e.phone,
    password: testPasswordHash,
    role: TEST_CREDENTIALS.e2e.role,
  });

  const e2eDoctorProfile = await ensureDoctorProfile({
    userId: e2eUser.id,
    specialtyId: createdSpecialties[0].id,
    licenseNumber: 'LIC-E2E-TEST',
  });
  console.log(`✅ Usuario E2E creado: ${TEST_CREDENTIALS.e2e.email}`);

  // ===========================================
  // ADMIN TEST USER (for admin tests)
  // ===========================================
  console.log('🔐 Creando usuario administrador de prueba...');
  const adminUser = await ensureSeedUser({
    email: TEST_CREDENTIALS.admin.email,
    name: 'Admin',
    lastName: 'Test',
    phone: TEST_CREDENTIALS.admin.phone,
    password: adminPasswordHash,
    role: TEST_CREDENTIALS.admin.role,
  });
  console.log(`✅ Usuario administrador creado: ${TEST_CREDENTIALS.admin.email}`);

  // ===========================================
  // DOCTOR TEST USER (for doctor tests)
  // ===========================================
  console.log('👨‍⚕️ Creando usuario doctor de prueba...');
  const doctorTestUser = await ensureSeedUser({
    email: TEST_CREDENTIALS.doctor.email,
    name: 'Doctor',
    lastName: 'Test',
    phone: TEST_CREDENTIALS.doctor.phone,
    password: doctorPasswordHash,
    role: TEST_CREDENTIALS.doctor.role,
  });

  const doctorTestDoctor = await ensureDoctorProfile({
    userId: doctorTestUser.id,
    specialtyId: createdSpecialties[1].id,
    licenseNumber: 'LIC-DOCTOR-TEST',
  });
  console.log(`✅ Usuario doctor creado: ${TEST_CREDENTIALS.doctor.email}`);

  // ===========================================
  // PATIENT TEST USER (for patient tests)
  // ===========================================
  console.log('👤 Creando usuario paciente de prueba...');
  const patientTestUser = await ensureSeedUser({
    email: TEST_CREDENTIALS.patient.email,
    name: 'Patient',
    lastName: 'Test',
    phone: TEST_CREDENTIALS.patient.phone,
    password: patientPasswordHash,
    role: TEST_CREDENTIALS.patient.role,
  });
  console.log(`✅ Usuario paciente creado: ${TEST_CREDENTIALS.patient.email}`);

  // ===========================================
  // PRINT TEST CREDENTIALS
  // ===========================================
  console.log('\n📋 CREDENCIALES DE PRUEBA (ver frontend/e2e/TEST_CREDENTIALS.md):');
  console.log('   ─────────────────────────────────────');
  console.log(`   👤 ADMIN:`);
  console.log(`      Email: ${TEST_CREDENTIALS.admin.email}`);
  console.log(`      Phone: ${TEST_CREDENTIALS.admin.phone}`);
  console.log(`      Password: ${TEST_CREDENTIALS.admin.password}`);
  console.log(`   👨‍⚕️ DOCTOR:`);
  console.log(`      Email: ${TEST_CREDENTIALS.doctor.email}`);
  console.log(`      Phone: ${TEST_CREDENTIALS.doctor.phone}`);
  console.log(`      Password: ${TEST_CREDENTIALS.doctor.password}`);
  console.log(`   👤 PATIENT:`);
  console.log(`      Email: ${TEST_CREDENTIALS.patient.email}`);
  console.log(`      Phone: ${TEST_CREDENTIALS.patient.phone}`);
  console.log(`      Password: ${TEST_CREDENTIALS.patient.password}`);
  console.log(`   🧪 E2E TEST:`);
  console.log(`      Email: ${TEST_CREDENTIALS.e2e.email}`);
  console.log(`      Phone: ${TEST_CREDENTIALS.e2e.phone}`);
  console.log(`      Password: ${TEST_CREDENTIALS.e2e.password}`);
  console.log('   ─────────────────────────────────────\n');

  console.log('👨‍⚕️ Creando doctores...');
  const doctors: Array<{
    id: string;
    userId: string;
    specialtyId: string;
    licenseNumber: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  
  // Add test doctors first so they also get patients assigned
  doctors.push(doctorTestDoctor);
  doctors.push(e2eDoctorProfile);
  
  for (let i = 0; i < 10; i++) {
    const firstName = doctorFirstNames[i];
    const lastName = doctorLastNames[i];
    const email = generateEmail(firstName, lastName, i);
    const phone = i < TEST_DOCTOR_PHONES.length
      ? TEST_DOCTOR_PHONES[i]
      : generateSeedDoctorPhone(i);

    const user = await ensureSeedUser({
      email,
      name: firstName,
      lastName,
      phone,
      password: hashedPassword,
      role: 'DOCTOR',
    });

    const doctor = await ensureDoctorProfile({
      userId: user.id,
      specialtyId: createdSpecialties[i].id,
      licenseNumber: `LIC-${String(i + 1).padStart(6, '0')}`,
    });

    doctors.push(doctor);
  }
  console.log(`✅ ${doctors.length} doctores creados`);

  console.log('👥 Asegurando pacientes demo con antecedentes clínicos...');
  const patients: Array<{
    id: string;
    userId: string;
    gender: string | null;
    birthDate: Date | null;
    allergies: string[];
    medications: string[];
    medicalHistory: string[];
    familyHistory: string[];
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  for (let i = 0; i < DEMO_PATIENT_COUNT; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 3) % lastNames.length];
    const email = generateSeedPatientEmail(i);
    const phone = generateSeedPatientPhone(i);
    const gender = Math.random() < 0.5 ? 'male' : 'female';
    const birthDate = generateBirthDate();
    const antecedents = generateAntecedents();

    const user = await ensureSeedUser({
      email,
      name: firstName,
      lastName,
      phone,
      password: hashedPassword,
      role: 'PATIENT',
    });

    const patient = await prisma.patient.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        registeredByDoctorId: doctors[i % doctors.length].id,
        gender,
        birthDate,
        allergies: antecedents.allergies,
        medications: antecedents.medications,
        medicalHistory: antecedents.medicalHistory,
        familyHistory: antecedents.familyHistory,
      },
      update: {
        registeredByDoctorId: doctors[i % doctors.length].id,
      },
    });

    patients.push(patient);
  }
  console.log(`✅ ${patients.length} pacientes creados con antecedentes clínicos`);

  console.log('📅 Creando citas demo si no existen todavía...');
  const baseDate = new Date('2026-01-01T00:00:00.000Z');
  let appointmentCount = 0;
  const appointments: Array<{
    id: string;
    patientId: string;
    doctorId: string;
    specialtyId: string;
    startAppointment: Date;
    endAppointment: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  for (const [patientIndex, patient] of patients.entries()) {
    for (const [doctorIndex, doctor] of doctors.entries()) {
      const slotSeed = patientIndex * doctors.length + doctorIndex;
      const daysOffset = slotSeed % 365;
      const startAppointment = generateAppointmentDate(baseDate, daysOffset, slotSeed);
      const endAppointment = new Date(startAppointment);
      endAppointment.setHours(endAppointment.getHours() + 1);

      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          patientId: patient.id,
          doctorId: doctor.id,
          startAppointment,
        },
      });

      const status = getRandomElement([...DEMO_APPOINTMENT_STATUSES]);

      const appointment =
        existingAppointment ??
        (await prisma.appointment.create({
          data: {
            patientId: patient.id,
            doctorId: doctor.id,
            specialtyId: doctor.specialtyId,
            startAppointment,
            endAppointment,
            status,
          },
        }));

      appointments.push(appointment);
      appointmentCount++;
      if (!existingAppointment && appointmentCount % 100 === 0) {
        console.log(`  ⏳ ${appointmentCount}/${DEMO_PATIENT_COUNT * doctors.length} citas procesadas...`);
      }
    }
  }
  console.log(`✅ ${appointmentCount} citas listas`);

  console.log('📋 Creando historias clínicas demo si no existen todavía...');
  let clinicHistoryCount = 0;

  for (const appointment of appointments) {
    const patient = patients.find(p => p.id === appointment.patientId);
    const doctor = doctors.find(d => d.id === appointment.doctorId);

    if (!patient || !doctor) continue;

    const existingClinicHistory = await prisma.clinicHistory.findUnique({
      where: { appointmentId: appointment.id },
    });

    if (existingClinicHistory) {
      clinicHistoryCount++;
      continue;
    }

    const consultationReason = getRandomElement(consultationReasons);
    const selectedSymptoms = getRandomElements(symptoms, 1, 4);
    const treatment = `Tratamiento prescrito según evaluación clínica. ${getRandomElement(['Reposo', 'Medicación', 'Terapia', 'Control'])} recomendado.`;

    const diagnosticName = getRandomElement(diagnosticNames);
    const diagnosticDescription = `Diagnóstico basado en síntomas y examen físico. ${diagnosticName} confirmado.`;

    const physicalExamName = getRandomElement(physicalExamNames);
    const physicalExamDescription = `Examen realizado: ${physicalExamName}. Resultados dentro de parámetros normales.`;

    const vitalSignsData = [
      {
        name: 'Presión arterial',
        value: `${110 + Math.floor(Math.random() * 30)}/${70 + Math.floor(Math.random() * 20)}`,
        unit: 'mmHg',
        measurement: 'sistólica/diastólica',
        description: 'Presión arterial medida',
      },
      {
        name: 'Temperatura',
        value: (36.0 + Math.random() * 1.5).toFixed(1),
        unit: '°C',
        measurement: 'axilar',
        description: 'Temperatura corporal',
      },
      {
        name: 'Frecuencia cardíaca',
        value: String(60 + Math.floor(Math.random() * 40)),
        unit: 'lpm',
        measurement: 'radial',
        description: 'Pulso medido',
      },
    ];

    const hasPrescription = Math.random() > 0.3;
    const medicationCount = hasPrescription ? Math.floor(Math.random() * 2) + 1 : 0;

    await prisma.clinicHistory.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        specialtyId: doctor.specialtyId,
        appointmentId: appointment.id,
        consultationReason,
        symptoms: selectedSymptoms,
        treatment,
        diagnostics: {
          create: {
            name: diagnosticName,
            description: diagnosticDescription,
          },
        },
        physicalExams: {
          create: {
            name: physicalExamName,
            description: physicalExamDescription,
          },
        },
        vitalSigns: {
          create: vitalSignsData,
        },
        ...(hasPrescription && medicationCount > 0
          ? {
            prescription: {
              create: {
                name: `Receta médica - ${consultationReason}`,
                description: 'Medicamentos prescritos según diagnóstico',
                prescriptionMedications: {
                  create: Array.from({ length: medicationCount }, () => {
                    const medName = getRandomElement(medicationNames);
                    return {
                      name: medName,
                      quantity: Math.floor(Math.random() * 20) + 10,
                      unit: 'tabletas',
                      frequency: getRandomElement(['Cada 8 horas', 'Cada 12 horas', 'Una vez al día', 'Cada 6 horas']),
                      duration: `${Math.floor(Math.random() * 7) + 3} días`,
                      indications: 'Tomar con alimentos',
                      administrationRoute: 'Oral',
                      description: `Medicamento: ${medName}`,
                    };
                  }),
                },
              },
            },
          }
          : {}),
      },
    });

    clinicHistoryCount++;
    if (clinicHistoryCount % 100 === 0) {
      console.log(`  ⏳ ${clinicHistoryCount}/${appointments.length} historias clínicas procesadas...`);
    }
  }
  console.log(`✅ ${clinicHistoryCount} historias clínicas listas`);

  console.log('✨ Seed completado exitosamente!');
  console.log(`📊 Resumen:`);
  console.log(`   - ${createdSpecialties.length} especialidades`);
  console.log(`   - ${doctors.length} doctores`);
  console.log(`   - ${patients.length} pacientes (con antecedentes clínicos)`);
  console.log(`   - ${appointmentCount} citas`);
  console.log(`   - ${clinicHistoryCount} historias clínicas`);
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
