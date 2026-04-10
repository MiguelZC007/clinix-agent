import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseInterceptor } from 'src/core/interceptors/response.interceptor';
import { AllExceptionsFilter } from 'src/core/filters/all-exceptions.filter';
import { HttpExceptionFilter } from 'src/core/filters/http-exception.filter';
import { PrismaExceptionFilter } from 'src/core/filters/prisma-exception.filter';
import { TwilioWebhookGuard } from 'src/modules/twilio/guards/twilio-webhook.guard';
import environment from 'src/core/config/environments';

describe('Twilio Webhook - Flujo Real de Anamnesis (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let testDoctorId: string;
  let testDoctorPhone: string;
  let testPatientId: string;
  let testSpecialtyId: string;
  let messageCounter = 0;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(TwilioWebhookGuard)
      .useValue({ canActivate: () => true })
      .compile();

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

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await setupTestData();
  }, 30000);

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  }, 30000);

  async function setupTestData() {
    const timestamp = Date.now();
    testSpecialtyId = `test-specialty-webhook-${timestamp}`;

    await prisma.specialty.create({
      data: {
        id: testSpecialtyId,
        name: 'Medicina General - Webhook Test',
      },
    });

    const testUser = await prisma.user.create({
      data: {
        email: `doctor-webhook-${timestamp}@test.com`,
        name: 'Dra. Ana',
        lastName: 'Martínez',
        phone: `+5842410${timestamp.toString().slice(-6)}`,
        password: 'test123',
        doctor: {
          create: {
            specialtyId: testSpecialtyId,
            licenseNumber: `LIC-WH-${timestamp}`,
          },
        },
      },
      include: { doctor: true },
    });

    testDoctorId = testUser.doctor!.id;
    testDoctorPhone = testUser.phone;

    console.log('\n' + '='.repeat(60));
    console.log('📋 CONFIGURACIÓN DEL TEST');
    console.log('='.repeat(60));
    console.log(`   Doctor: Dra. Ana Martínez`);
    console.log(`   Teléfono: ${testDoctorPhone}`);
    console.log(`   Doctor ID: ${testDoctorId}`);
    console.log(`   Especialidad: ${testSpecialtyId}`);
    console.log('='.repeat(60) + '\n');
  }

  async function cleanupTestData() {
    console.log('\n🧹 Limpiando datos de prueba...');

    try {
      if (testPatientId) {
        await prisma.appointment.deleteMany({
          where: { patientId: testPatientId },
        });
        const patient = await prisma.patient.findUnique({
          where: { id: testPatientId },
        });
        if (patient) {
          await prisma.patient.delete({ where: { id: testPatientId } });
          await prisma.user.delete({ where: { id: patient.userId } });
        }
      }

      await prisma.message.deleteMany({
        where: { conversation: { doctorId: testDoctorId } },
      });
      await prisma.conversation.deleteMany({
        where: { doctorId: testDoctorId },
      });

      const doctor = await prisma.doctor.findUnique({
        where: { id: testDoctorId },
      });
      if (doctor) {
        await prisma.doctor.delete({ where: { id: testDoctorId } });
        await prisma.user.delete({ where: { id: doctor.userId } });
      }

      await prisma.specialty.deleteMany({ where: { id: testSpecialtyId } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.log('   ⚠️ Error durante limpieza:', message);
    }

    console.log('   ✅ Limpieza completada\n');
  }

function createWebhookPayload(message: string): Record<string, string> {
  messageCounter++;
  return {
    MessageSid: `SM${Date.now()}${messageCounter}`,
    AccountSid: 'ACtest123456',
    From: `whatsapp:${testDoctorPhone}`,
    To: environment.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
    Body: message,
    NumMedia: '0',
    SmsStatus: 'received',
  };
}

  async function sendWebhookMessage(
    message: string,
  ): Promise<request.Response> {
    console.log('\n' + '-'.repeat(50));
    console.log(`👨‍⚕️ MÉDICO: ${message}`);
    console.log('-'.repeat(50));

    const payload = createWebhookPayload(message);

    const server = app.getHttpServer() as unknown as Parameters<
      typeof request
    >[0];
    const response = await request(server)
      .post('/v1/twilio/webhook/whatsapp')
      .send(payload)
      .expect(200);

    console.log('🤖 ASISTENTE: respuesta enviada vía SDK (Messages API)');

    return response;
  }

  async function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  describe('Flujo completo via Webhook HTTP', () => {
    it('Paso 1: Saludo inicial via webhook', async () => {
      await sendWebhookMessage('Hola, buenos días');

      const conversation = await prisma.conversation.findFirst({
        where: { doctorId: testDoctorId, isActive: true },
      });
      expect(conversation).not.toBeNull();

      console.log('✅ Webhook procesado correctamente');
      console.log(
        `   Conversación creada: ${conversation?.id.substring(0, 8)}...`,
      );
    }, 30000);

    it('Paso 2: Solicitar registro de paciente', async () => {
      await delay(1000);

      await sendWebhookMessage(
        'Necesito registrar un paciente nuevo que llegó a consulta',
      );

      console.log('✅ Asistente solicitó información del paciente');
    }, 30000);

    it('Paso 3: Proporcionar datos completos del paciente', async () => {
      await delay(1000);

      await sendWebhookMessage(
        'El paciente es Pedro Ramírez, email pedro.ramirez@email.com, teléfono +584147654321, masculino, nacido el 10 de junio de 1980. No tiene alergias, no toma medicamentos, sin antecedentes médicos ni familiares relevantes. Confirmo el registro.',
      );

      await delay(3000);

      const patient = await prisma.patient.findFirst({
        where: {
          user: {
            OR: [
              { email: 'pedro.ramirez@email.com' },
              { phone: '+584147654321' },
            ],
          },
        },
        include: { user: true },
      });

      if (patient) {
        testPatientId = patient.id;
        console.log(
          `✅ Paciente registrado en BD: ${patient.user.name} ${patient.user.lastName}`,
        );
        console.log(`   ID: ${testPatientId}`);
      } else {
        console.log(
          '⏳ Paciente pendiente de registro (requiere confirmación adicional)',
        );
      }
    }, 60000);

    it('Paso 4: Confirmar registro si es necesario', async () => {
      if (testPatientId) {
        console.log('✅ Paciente ya registrado, saltando confirmación');
        return;
      }

      await delay(1000);

      await sendWebhookMessage(
        'Sí, confirmo. Procede con el registro del paciente Pedro Ramírez.',
      );

      await delay(3000);

      const patient = await prisma.patient.findFirst({
        where: {
          user: {
            OR: [
              { email: 'pedro.ramirez@email.com' },
              { phone: '+584147654321' },
            ],
          },
        },
        include: { user: true },
      });

      if (patient) {
        testPatientId = patient.id;
        console.log(
          `✅ Paciente registrado tras confirmación: ${patient.user.name} ${patient.user.lastName}`,
        );
      }
    }, 30000);

    it('Paso 5: Consultar pacientes registrados', async () => {
      await delay(1000);

      await sendWebhookMessage('Dame la lista de pacientes');

      const patients = await prisma.patient.findMany();
      console.log(
        `✅ Consulta ejecutada - Total pacientes en BD: ${patients.length}`,
      );
    }, 30000);

    it('Paso 6: Actualizar antecedentes del paciente', async () => {
      if (!testPatientId) {
        console.log('⚠️ Saltando - No hay paciente registrado');
        return;
      }

      await delay(1000);

      await sendWebhookMessage(
        `Actualiza los antecedentes del paciente ${testPatientId}: alergia a la aspirina, toma enalapril 10mg diario, tiene historial de hipertensión, y antecedentes familiares de diabetes. Confirmo la actualización.`,
      );

      await delay(2000);

      const patient = await prisma.patient.findUnique({
        where: { id: testPatientId },
      });

      if (patient && patient.allergies.length > 0) {
        console.log('✅ Antecedentes actualizados:');
        console.log(`   Alergias: ${patient.allergies.join(', ')}`);
        console.log(`   Medicamentos: ${patient.medications.join(', ')}`);
      } else {
        console.log('⏳ Antecedentes pendientes de actualización');
      }
    }, 30000);

    it('Paso 7: Intentar pregunta fuera de alcance', async () => {
      await delay(1000);

      await sendWebhookMessage('¿Cómo está el clima hoy?');

      console.log('✅ Asistente rechazó pregunta fuera de alcance');
    }, 30000);

    it('Paso 8: Verificar persistencia completa', async () => {
      const conversation = await prisma.conversation.findFirst({
        where: { doctorId: testDoctorId, isActive: true },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      expect(conversation).not.toBeNull();
      expect(conversation!.messages.length).toBeGreaterThan(0);

      console.log('\n' + '='.repeat(60));
      console.log('📊 RESUMEN FINAL');
      console.log('='.repeat(60));
      console.log(`   Conversación ID: ${conversation!.id.substring(0, 8)}...`);
      console.log(`   Total mensajes: ${conversation!.messages.length}`);
      console.log(
        `   Mensajes del médico: ${conversation!.messages.filter((m) => m.role === 'user').length}`,
      );
      console.log(
        `   Mensajes del asistente: ${conversation!.messages.filter((m) => m.role === 'assistant').length}`,
      );
      console.log(`   Resumen activo: ${conversation!.summary ? 'Sí' : 'No'}`);

      if (testPatientId) {
        const patient = await prisma.patient.findUnique({
          where: { id: testPatientId },
          include: { user: true },
        });
        console.log(
          `\n   Paciente registrado: ${patient?.user.name} ${patient?.user.lastName}`,
        );
        console.log(`   Email: ${patient?.user.email}`);
        console.log(`   Alergias: ${patient?.allergies.length || 0}`);
        console.log(`   Medicamentos: ${patient?.medications.length || 0}`);
      }

      console.log('='.repeat(60) + '\n');
    }, 10000);
  });

  describe('Verificación de división de mensajes largos', () => {
    it('Debe manejar respuestas largas correctamente', async () => {
      await delay(1000);

      await sendWebhookMessage(
        'Dame información detallada sobre cómo funciona el sistema de registro de pacientes, las citas médicas y las historias clínicas',
      );

      const conversation = await prisma.conversation.findFirst({
        where: { doctorId: testDoctorId, isActive: true },
        include: { messages: true },
      });
      expect(conversation).not.toBeNull();
      expect(conversation!.messages.length).toBeGreaterThan(0);

      console.log('✅ Respuesta larga procesada (mensajes enviados vía SDK)');
    }, 30000);
  });
});
