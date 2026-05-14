import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { Role } from 'src/core/enum/role.enum';
import { AllExceptionsFilter } from 'src/core/filters/all-exceptions.filter';
import { HttpExceptionFilter } from 'src/core/filters/http-exception.filter';
import { PrismaExceptionFilter } from 'src/core/filters/prisma-exception.filter';
import { ResponseInterceptor } from 'src/core/interceptors/response.interceptor';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { ClinicHistoryModule } from 'src/modules/clinic-history/clinic-history.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';

type ClinicHistoryResponseBody = {
  success?: boolean;
  data?: {
    id?: string;
    consultationReason?: string;
    symptoms?: string[];
    treatment?: string;
    diagnostics?: Array<{ name?: string; description?: string }>;
    physicalExams?: Array<{ name?: string; description?: string }>;
    vitalSigns?: Array<{
      name?: string;
      value?: string;
      unit?: string;
      measurement?: string;
    }>;
    prescription?: {
      name?: string;
      description?: string;
      medications?: Array<{
        name?: string;
        quantity?: number;
        unit?: string;
        frequency?: string;
        duration?: string;
        indications?: string;
        administrationRoute?: string;
      }>;
    };
  };
};

type ValidationCase = {
  appointmentId: string;
  payload: Record<string, unknown>;
};

const CASE_COUNT = 100;
const EXPECTED_STRUCTURED_FIELDS_PER_CASE = 32;

describe('Validación técnica de anamnesis simuladas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let httpServer: Parameters<typeof request>[0];
  let accessToken: string;
  let doctorId: string;
  let doctorUserId: string;
  let specialtyId: string;
  let validationCases: ValidationCase[] = [];
  const patientIds: string[] = [];
  const patientUserIds: string[] = [];
  const appointmentIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        JwtModule.register({
          global: true,
          secret: process.env.JWT_SECRET ?? 'e2e-dev-secret',
          signOptions: { expiresIn: '30d' },
        }),
        ClinicHistoryModule,
      ],
      providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(
      new AllExceptionsFilter(),
      new PrismaExceptionFilter(),
      new HttpExceptionFilter(),
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await setupFixture();
  }, 60000);

  afterAll(async () => {
    await cleanupFixture();
    await app.close();
  }, 60000);

  it(
    'registra 100 anamnesis simuladas y genera métricas de completitud y tiempo del prototipo',
    async () => {
      const durationsMs: number[] = [];
      let successfulRecords = 0;
      let completedStructuredFields = 0;
      const failedCases: Array<{ index: number; status: number; body: unknown }> = [];

      for (const [index, validationCase] of validationCases.entries()) {
        const start = process.hrtime.bigint();
        const response = await request(httpServer)
          .post('/v1/clinic-histories')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(validationCase.payload);
        const end = process.hrtime.bigint();

        durationsMs.push(Number(end - start) / 1_000_000);

        if (response.status !== 201) {
          failedCases.push({ index: index + 1, status: response.status, body: response.body });
          continue;
        }

        const body = response.body as ClinicHistoryResponseBody;
        expect(body.success).toBe(true);
        expect(body.data?.id).toBeDefined();

        successfulRecords += 1;
        completedStructuredFields += countCompletedStructuredFields(body);
      }

      const totalExpectedFields = CASE_COUNT * EXPECTED_STRUCTURED_FIELDS_PER_CASE;
      const completionRate = (completedStructuredFields / totalExpectedFields) * 100;
      const successRate = (successfulRecords / CASE_COUNT) * 100;
      const averageTimeMs = average(durationsMs);
      const sortedDurations = [...durationsMs].sort((a, b) => a - b);

      const report = {
        validationType: 'technical-validation-with-simulated-anamnesis',
        note:
          'Resultados de validación técnica con casos clínicos simulados; no representan validación clínica ni usabilidad con médicos reales.',
        sampleSize: CASE_COUNT,
        successfulRecords,
        failedRecords: failedCases.length,
        successRatePercent: round(successRate),
        expectedStructuredFieldsPerCase: EXPECTED_STRUCTURED_FIELDS_PER_CASE,
        completedStructuredFields,
        totalExpectedFields,
        completionRatePercent: round(completionRate),
        timing: {
          measurementMethod: 'Jest e2e + supertest + process.hrtime.bigint()',
          averageMs: round(averageTimeMs),
          minMs: round(sortedDurations[0] ?? 0),
          maxMs: round(sortedDurations[sortedDurations.length - 1] ?? 0),
          p95Ms: round(percentile(sortedDurations, 0.95)),
        },
        generatedAt: new Date().toISOString(),
        failedCases,
      };

      writeValidationReport(report);

      expect(failedCases).toEqual([]);
      expect(successfulRecords).toBe(CASE_COUNT);
      expect(completionRate).toBe(100);
    },
    180000,
  );

  async function setupFixture(): Promise<void> {
    const timestamp = Date.now();
    specialtyId = `validation-specialty-${timestamp}`;

    await prisma.specialty.create({
      data: {
        id: specialtyId,
        name: 'Medicina General Validación Técnica',
      },
    });

    const doctorUser = await prisma.user.create({
      data: {
        email: `validation-doctor-${timestamp}@test.com`,
        name: 'Dra. Validación',
        lastName: 'Técnica',
        phone: `+59179${timestamp.toString().slice(-7)}`,
        password: null,
        role: Role.DOCTOR,
        doctor: {
          create: {
            specialtyId,
            licenseNumber: `LIC-VALIDATION-${timestamp}`,
          },
        },
      },
      include: { doctor: true },
    });

    doctorUserId = doctorUser.id;
    doctorId = doctorUser.doctor!.id;

    accessToken = await jwtService.signAsync({
      sub: doctorUser.id,
      phone: doctorUser.phone,
      role: Role.DOCTOR,
    });

    validationCases = [];
    for (let index = 0; index < CASE_COUNT; index += 1) {
      const patientUser = await prisma.user.create({
        data: {
          email: `validation-patient-${timestamp}-${index}@test.com`,
          name: patientNames[index % patientNames.length],
          lastName: `Simulado ${index + 1}`,
          phone: `+59168${timestamp.toString().slice(-5)}${index.toString().padStart(3, '0')}`,
          role: Role.PATIENT,
          patient: {
            create: {
              registeredByDoctorId: doctorId,
              gender: index % 2 === 0 ? 'female' : 'male',
              birthDate: new Date(1970 + (index % 35), index % 12, (index % 27) + 1),
              allergies: [],
              medications: [],
              medicalHistory: [clinicalScenarios[index % clinicalScenarios.length].history],
              familyHistory: ['Sin antecedentes familiares relevantes declarados'],
            },
          },
        },
        include: { patient: true },
      });

      patientUserIds.push(patientUser.id);
      patientIds.push(patientUser.patient!.id);

      const startAppointment = new Date(Date.UTC(2026, 0, 1, 8 + (index % 8), index % 60));
      const appointment = await prisma.appointment.create({
        data: {
          patientId: patientUser.patient!.id,
          doctorId,
          specialtyId,
          reason: clinicalScenarios[index % clinicalScenarios.length].reason,
          startAppointment,
          endAppointment: new Date(startAppointment.getTime() + 30 * 60 * 1000),
          status: 'scheduled',
        },
      });

      appointmentIds.push(appointment.id);
      validationCases.push({
        appointmentId: appointment.id,
        payload: buildAnamnesisPayload(appointment.id, index),
      });
    }
  }

  async function cleanupFixture(): Promise<void> {
    const histories = await prisma.clinicHistory.findMany({
      where: { appointmentId: { in: appointmentIds } },
      select: { id: true, prescription: { select: { id: true } } },
    });
    const historyIds = histories.map((history) => history.id);
    const prescriptionIds = histories
      .map((history) => history.prescription?.id)
      .filter((id): id is string => Boolean(id));

    await prisma.prescriptionMedication.deleteMany({
      where: { prescriptionId: { in: prescriptionIds } },
    });
    await prisma.prescription.deleteMany({ where: { id: { in: prescriptionIds } } });
    await prisma.vitalSign.deleteMany({ where: { clinicHistoryId: { in: historyIds } } });
    await prisma.physicalExam.deleteMany({ where: { clinicHistoryId: { in: historyIds } } });
    await prisma.diagnostic.deleteMany({ where: { clinicHistoryId: { in: historyIds } } });
    await prisma.clinicHistory.deleteMany({ where: { id: { in: historyIds } } });
    await prisma.appointment.deleteMany({ where: { id: { in: appointmentIds } } });
    await prisma.patient.deleteMany({ where: { id: { in: patientIds } } });
    await prisma.user.deleteMany({ where: { id: { in: patientUserIds } } });
    await prisma.doctor.deleteMany({ where: { id: doctorId } });
    await prisma.user.deleteMany({ where: { id: doctorUserId } });
    await prisma.specialty.deleteMany({ where: { id: specialtyId } });
  }
});

const patientNames = ['Ana', 'Carlos', 'María', 'José', 'Lucía', 'Miguel', 'Sofía', 'Diego'];

const clinicalScenarios = [
  {
    reason: 'Dolor abdominal y náuseas de inicio reciente',
    symptoms: ['dolor abdominal', 'náuseas', 'distensión abdominal'],
    diagnostic: 'Gastroenteritis aguda probable',
    history: 'Sin antecedentes digestivos de importancia',
    treatment: 'Hidratación oral, dieta blanda y control de signos de alarma durante 48 horas',
  },
  {
    reason: 'Cefalea persistente asociada a tensión cervical',
    symptoms: ['cefalea', 'dolor cervical', 'fotofobia leve'],
    diagnostic: 'Cefalea tensional',
    history: 'Episodios previos de cefalea ocasional',
    treatment: 'Reposo relativo, higiene del sueño y analgésico según tolerancia clínica',
  },
  {
    reason: 'Tos seca y congestión nasal de tres días',
    symptoms: ['tos seca', 'congestión nasal', 'odinofagia'],
    diagnostic: 'Infección respiratoria alta',
    history: 'Sin antecedentes respiratorios crónicos',
    treatment: 'Manejo sintomático, líquidos abundantes y reevaluación si presenta fiebre persistente',
  },
  {
    reason: 'Dolor lumbar posterior a esfuerzo físico',
    symptoms: ['lumbalgia', 'rigidez lumbar', 'dolor al movimiento'],
    diagnostic: 'Lumbalgia mecánica',
    history: 'Antecedente de dolor lumbar leve intermitente',
    treatment: 'Reposo relativo, ejercicios suaves y analgesia por corto periodo',
  },
];

function buildAnamnesisPayload(appointmentId: string, index: number): Record<string, unknown> {
  const scenario = clinicalScenarios[index % clinicalScenarios.length];

  return {
    appointmentId,
    consultationReason: `${scenario.reason}. Caso simulado ${index + 1}.`,
    symptoms: scenario.symptoms,
    treatment: scenario.treatment,
    diagnostics: [
      {
        name: scenario.diagnostic,
        description: `Diagnóstico presuntivo basado en anamnesis y examen físico del caso simulado ${index + 1}.`,
      },
    ],
    physicalExams: [
      {
        name: 'Examen físico general',
        description: 'Paciente consciente, orientado, hidratado y hemodinámicamente estable.',
      },
    ],
    vitalSigns: [
      { name: 'Presión arterial', value: `${110 + (index % 20)}/${70 + (index % 10)}`, unit: 'mmHg', measurement: 'sistólica/diastólica' },
      { name: 'Frecuencia cardíaca', value: `${68 + (index % 18)}`, unit: 'lpm', measurement: 'latidos por minuto' },
      { name: 'Temperatura', value: `${36 + (index % 10) / 10}`, unit: '°C', measurement: 'axilar' },
      { name: 'Saturación de oxígeno', value: `${96 + (index % 4)}`, unit: '%', measurement: 'pulsioximetría' },
    ],
    prescription: {
      name: `Receta caso simulado ${index + 1}`,
      description: 'Tratamiento sintomático indicado para el caso clínico simulado.',
      medications: [
        {
          name: index % 2 === 0 ? 'Paracetamol' : 'Ibuprofeno',
          quantity: 10,
          unit: 'tabletas',
          frequency: 'Cada 8 horas',
          duration: '3 días',
          indications: 'Tomar después de los alimentos y suspender ante reacción adversa.',
          administrationRoute: 'Oral',
        },
      ],
    },
  };
}

function countCompletedStructuredFields(body: ClinicHistoryResponseBody): number {
  const history = body.data;
  if (!history) return 0;

  let completed = 0;
  completed += Boolean(history.consultationReason) ? 1 : 0;
  completed += Array.isArray(history.symptoms) && history.symptoms.length > 0 ? 1 : 0;
  completed += Boolean(history.treatment) ? 1 : 0;

  const diagnostic = history.diagnostics?.[0];
  completed += Boolean(diagnostic?.name) ? 1 : 0;
  completed += Boolean(diagnostic?.description) ? 1 : 0;

  const physicalExam = history.physicalExams?.[0];
  completed += Boolean(physicalExam?.name) ? 1 : 0;
  completed += Boolean(physicalExam?.description) ? 1 : 0;

  for (const vitalSign of history.vitalSigns ?? []) {
    completed += Boolean(vitalSign.name) ? 1 : 0;
    completed += Boolean(vitalSign.value) ? 1 : 0;
    completed += Boolean(vitalSign.unit) ? 1 : 0;
    completed += Boolean(vitalSign.measurement) ? 1 : 0;
  }

  const prescription = history.prescription;
  completed += Boolean(prescription?.name) ? 1 : 0;
  completed += Boolean(prescription?.description) ? 1 : 0;

  const medication = prescription?.medications?.[0];
  completed += Boolean(medication?.name) ? 1 : 0;
  completed += typeof medication?.quantity === 'number' ? 1 : 0;
  completed += Boolean(medication?.unit) ? 1 : 0;
  completed += Boolean(medication?.frequency) ? 1 : 0;
  completed += Boolean(medication?.duration) ? 1 : 0;
  completed += Boolean(medication?.indications) ? 1 : 0;
  completed += Boolean(medication?.administrationRoute) ? 1 : 0;

  return completed;
}

function writeValidationReport(report: unknown): void {
  const outputDir = join(process.cwd(), 'test-results');
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    join(outputDir, 'anamnesis-technical-validation.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(sortedValues: number[], percentileValue: number): number {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil(sortedValues.length * percentileValue) - 1;
  return sortedValues[Math.min(Math.max(index, 0), sortedValues.length - 1)];
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
