const mockChatCompletionsCreate = jest.fn();

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockChatCompletionsCreate,
      },
    },
  })),
}));

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Role } from 'src/core/enum/role.enum';
import { AllExceptionsFilter } from 'src/core/filters/all-exceptions.filter';
import { HttpExceptionFilter } from 'src/core/filters/http-exception.filter';
import { PrismaExceptionFilter } from 'src/core/filters/prisma-exception.filter';
import { ResponseInterceptor } from 'src/core/interceptors/response.interceptor';
import { AppointmentService } from 'src/modules/appointment/appointment.service';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { ClinicHistoryModule } from 'src/modules/clinic-history/clinic-history.module';
import { ClinicHistoryService } from 'src/modules/clinic-history/clinic-history.service';
import { ConversationService } from 'src/modules/openai/conversation.service';
import { OpenaiService } from 'src/modules/openai/openai.service';
import { StructuringService } from 'src/modules/openai/structuring.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';

type ClinicHistoryDetailResponse = {
  success?: boolean;
  data?: {
    id?: string;
    appointmentId?: string | null;
    consultationReason?: string;
    symptoms?: string[];
    treatment?: string;
    diagnostics?: Array<{ name?: string; description?: string }>;
    physicalExams?: Array<{ name?: string; description?: string }>;
    vitalSigns?: Array<{ name?: string; value?: string; unit?: string }>;
    prescription?: { medications?: Array<{ name?: string }> };
  };
};

describe('Flujo conversacional IA para anamnesis (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let openaiService: OpenaiService;
  let jwtService: JwtService;
  let httpServer: Parameters<typeof request>[0];
  let accessToken: string;
  let doctorId: string;
  let doctorUserId: string;
  let doctorPhone: string;
  let patientId: string;
  let patientUserId: string;
  let specialtyId: string;
  let appointmentId: string;
  let clinicHistoryId: string;

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
      providers: [
        AppointmentService,
        ConversationService,
        OpenaiService,
        {
          provide: StructuringService,
          useValue: { structureAnamnesis: jest.fn() },
        },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
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
    openaiService = moduleFixture.get<OpenaiService>(OpenaiService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await setupFixture();
  }, 60000);

  beforeEach(() => {
    mockChatCompletionsCreate.mockReset();
  });

  afterAll(async () => {
    await cleanupFixture();
    await app.close();
  }, 60000);

  it('guarda la conversación paso a paso y luego persiste la anamnesis verificable por endpoint', async () => {
    mockChatCompletionsCreate
      .mockResolvedValueOnce(assistantText('Indíqueme el paciente o la cita para iniciar la anamnesis.'))
      .mockResolvedValueOnce(assistantText('Paciente y cita identificados. Indíqueme motivo de consulta y síntomas.'))
      .mockResolvedValueOnce(assistantText('Datos clínicos recibidos. Indíqueme examen físico, signos vitales y diagnóstico.'))
      .mockResolvedValueOnce(assistantToolCall('call-create-history', 'create_clinic_history', buildClinicHistoryToolArgs()))
      .mockResolvedValueOnce(assistantText('Historia clínica registrada correctamente desde la conversación.'));

    await expect(
      openaiService.processMessageFromDoctor(
        doctorPhone,
        `Iniciar anamnesis para la cita ${appointmentId}`,
      ),
    ).resolves.toContain('paciente');

    await expect(
      openaiService.processMessageFromDoctor(
        doctorPhone,
        'Paciente femenina con dolor abdominal de 24 horas, náuseas y distensión abdominal.',
      ),
    ).resolves.toContain('Paciente');

    await expect(
      openaiService.processMessageFromDoctor(
        doctorPhone,
        'Al examen físico: abdomen blando, doloroso en epigastrio. PA 118/76, FC 82, temperatura 36.8, saturación 98%. Diagnóstico probable gastroenteritis aguda.',
      ),
    ).resolves.toContain('Datos clínicos');

    await expect(
      openaiService.processMessageFromDoctor(
        doctorPhone,
        'Tratamiento: hidratación oral, dieta blanda y paracetamol si dolor. Guardar la historia clínica.',
      ),
    ).resolves.toContain('registrada');

    const conversation = await prisma.conversation.findFirst({
      where: { doctorId, isActive: true },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    expect(conversation).not.toBeNull();
    expect(conversation?.messages).toHaveLength(8);
    expect(conversation?.messages.filter((message) => message.role === 'user')).toHaveLength(4);
    expect(conversation?.messages.filter((message) => message.role === 'assistant')).toHaveLength(4);

    const persistedHistory = await prisma.clinicHistory.findUnique({
      where: { appointmentId },
    });
    expect(persistedHistory).not.toBeNull();
    clinicHistoryId = persistedHistory!.id;

    const response = await request(httpServer)
      .get(`/v1/clinic-histories/${clinicHistoryId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as ClinicHistoryDetailResponse;
    expect(body.success).toBe(true);
    expect(body.data?.appointmentId).toBe(appointmentId);
    expect(body.data?.consultationReason).toBe('Dolor abdominal de 24 horas asociado a náuseas y distensión abdominal');
    expect(body.data?.symptoms).toEqual(['dolor abdominal', 'náuseas', 'distensión abdominal']);
    expect(body.data?.diagnostics?.[0]?.name).toBe('Gastroenteritis aguda probable');
    expect(body.data?.physicalExams?.[0]?.name).toBe('Examen abdominal');
    expect(body.data?.vitalSigns).toHaveLength(4);
    expect(body.data?.prescription?.medications?.[0]?.name).toBe('Paracetamol');
  }, 120000);

  async function setupFixture(): Promise<void> {
    const timestamp = Date.now();
    specialtyId = `conversation-validation-specialty-${timestamp}`;

    await prisma.specialty.create({
      data: {
        id: specialtyId,
        name: 'Medicina General Conversación Validación',
      },
    });

    const doctorUser = await prisma.user.create({
      data: {
        email: `conversation-validation-doctor-${timestamp}@test.com`,
        name: 'Dra. Conversación',
        lastName: 'IA',
        phone: `+59167${timestamp.toString().slice(-7)}`,
        role: Role.DOCTOR,
        doctor: {
          create: {
            specialtyId,
            licenseNumber: `LIC-CONV-VALIDATION-${timestamp}`,
          },
        },
      },
      include: { doctor: true },
    });

    doctorUserId = doctorUser.id;
    doctorId = doctorUser.doctor!.id;
    doctorPhone = doctorUser.phone;
    accessToken = await jwtService.signAsync({
      sub: doctorUser.id,
      phone: doctorUser.phone,
      role: Role.DOCTOR,
    });

    const patientUser = await prisma.user.create({
      data: {
        email: `conversation-validation-patient-${timestamp}@test.com`,
        name: 'Ana',
        lastName: 'Paciente Conversacional',
        phone: `+59166${timestamp.toString().slice(-7)}`,
        role: Role.PATIENT,
        patient: {
          create: {
            registeredByDoctorId: doctorId,
            gender: 'female',
            birthDate: new Date('1988-04-12T00:00:00.000Z'),
            allergies: [],
            medications: [],
            medicalHistory: ['Sin antecedentes patológicos relevantes'],
            familyHistory: ['Sin antecedentes familiares relevantes'],
          },
        },
      },
      include: { patient: true },
    });

    patientUserId = patientUser.id;
    patientId = patientUser.patient!.id;

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        specialtyId,
        reason: 'Dolor abdominal',
        startAppointment: new Date('2026-05-12T14:00:00.000Z'),
        endAppointment: new Date('2026-05-12T14:30:00.000Z'),
        status: 'scheduled',
      },
    });
    appointmentId = appointment.id;
  }

  async function cleanupFixture(): Promise<void> {
    if (clinicHistoryId) {
      const history = await prisma.clinicHistory.findUnique({
        where: { id: clinicHistoryId },
        select: { prescription: { select: { id: true } } },
      });
      const prescriptionId = history?.prescription?.id;
      if (prescriptionId) {
        await prisma.prescriptionMedication.deleteMany({ where: { prescriptionId } });
        await prisma.prescription.deleteMany({ where: { id: prescriptionId } });
      }
      await prisma.vitalSign.deleteMany({ where: { clinicHistoryId } });
      await prisma.physicalExam.deleteMany({ where: { clinicHistoryId } });
      await prisma.diagnostic.deleteMany({ where: { clinicHistoryId } });
      await prisma.clinicHistory.deleteMany({ where: { id: clinicHistoryId } });
    }

    if (doctorId) {
      await prisma.message.deleteMany({ where: { conversation: { doctorId } } });
      await prisma.conversation.deleteMany({ where: { doctorId } });
    }

    if (appointmentId) await prisma.appointment.deleteMany({ where: { id: appointmentId } });
    if (patientId) await prisma.patient.deleteMany({ where: { id: patientId } });
    if (patientUserId) await prisma.user.deleteMany({ where: { id: patientUserId } });
    if (doctorId) await prisma.doctor.deleteMany({ where: { id: doctorId } });
    if (doctorUserId) await prisma.user.deleteMany({ where: { id: doctorUserId } });
    if (specialtyId) await prisma.specialty.deleteMany({ where: { id: specialtyId } });
  }

  function buildClinicHistoryToolArgs(): Record<string, unknown> {
    return {
      appointmentId,
      consultationReason: 'Dolor abdominal de 24 horas asociado a náuseas y distensión abdominal',
      symptoms: ['dolor abdominal', 'náuseas', 'distensión abdominal'],
      treatment: 'Hidratación oral, dieta blanda, control de signos de alarma y paracetamol si presenta dolor',
      diagnostics: [
        {
          name: 'Gastroenteritis aguda probable',
          description: 'Cuadro compatible por evolución clínica y síntomas gastrointestinales.',
        },
      ],
      physicalExams: [
        {
          name: 'Examen abdominal',
          description: 'Abdomen blando, depresible, doloroso en epigastrio, sin signos de irritación peritoneal.',
        },
      ],
      vitalSigns: [
        { name: 'Presión arterial', value: '118/76', unit: 'mmHg', measurement: 'sistólica/diastólica' },
        { name: 'Frecuencia cardíaca', value: '82', unit: 'lpm', measurement: 'latidos por minuto' },
        { name: 'Temperatura', value: '36.8', unit: '°C', measurement: 'axilar' },
        { name: 'Saturación de oxígeno', value: '98', unit: '%', measurement: 'pulsioximetría' },
      ],
      prescription: {
        name: 'Tratamiento sintomático gastrointestinal',
        description: 'Manejo inicial ambulatorio para síntomas gastrointestinales.',
        medications: [
          {
            name: 'Paracetamol',
            quantity: 10,
            unit: 'tabletas',
            frequency: 'Cada 8 horas',
            duration: '3 días',
            indications: 'Tomar solo si presenta dolor o malestar general.',
            administrationRoute: 'Oral',
          },
        ],
      },
    };
  }
});

function assistantText(content: string) {
  return { choices: [{ message: { content } }] };
}

function assistantToolCall(id: string, name: string, args: Record<string, unknown>) {
  return {
    choices: [
      {
        message: {
          content: null,
          tool_calls: [
            {
              id,
              type: 'function',
              function: { name, arguments: JSON.stringify(args) },
            },
          ],
        },
      },
    ],
  };
}
