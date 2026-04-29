import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseInterceptor } from 'src/core/interceptors/response.interceptor';
import { AllExceptionsFilter } from 'src/core/filters/all-exceptions.filter';
import { PrismaExceptionFilter } from 'src/core/filters/prisma-exception.filter';
import { HttpExceptionFilter } from 'src/core/filters/http-exception.filter';
import { Role } from 'src/core/enum/role.enum';

describe('Patients RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let specialtyId: string;
  let doctorId: string;
  let doctorPhone: string;
  let adminUserId: string;
  let doctorUserId: string;
  let patientUserId: string;
  let seededPatientUserId: string;

  let adminToken: string;
  let doctorToken: string;
  let patientToken: string;
  const createdPatientPhones: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await setupData();
  }, 40000);

  afterAll(async () => {
    await cleanupData();
    await app.close();
  }, 40000);

  async function setupData() {
    const timestamp = Date.now();
    specialtyId = `rbac2-specialty-${timestamp}`;

    await prisma.specialty.create({
      data: {
        id: specialtyId,
        name: `RBAC2 Specialty ${timestamp}`,
      },
    });

    const hashedPassword = await bcrypt.hash('test123', 10);

    const adminUser = await prisma.user.create({
      data: {
        email: `rbac2-admin-${timestamp}@test.com`,
        name: 'Admin',
        lastName: 'RBAC2',
        phone: `+5801${timestamp.toString().slice(-8)}`,
        password: hashedPassword,
        role: Role.ADMIN,
      },
    });
    adminUserId = adminUser.id;

    const doctorUser = await prisma.user.create({
      data: {
        email: `rbac2-doctor-${timestamp}@test.com`,
        name: 'Doctor',
        lastName: 'RBAC2',
        phone: `+5802${timestamp.toString().slice(-8)}`,
        password: hashedPassword,
        role: Role.DOCTOR,
        doctor: {
          create: {
            specialtyId,
            licenseNumber: `LIC-RBAC2-${timestamp}`,
          },
        },
      },
      include: {
        doctor: true,
      },
    });
    doctorUserId = doctorUser.id;
    doctorPhone = doctorUser.phone;
    doctorId = doctorUser.doctor!.id;

    const patientUser = await prisma.user.create({
      data: {
        email: `rbac2-patient-${timestamp}@test.com`,
        name: 'Patient',
        lastName: 'RBAC2',
        phone: `+5803${timestamp.toString().slice(-8)}`,
        password: hashedPassword,
        role: Role.PATIENT,
      },
    });
    patientUserId = patientUser.id;

    const seededPatientUser = await prisma.user.create({
      data: {
        email: `rbac2-seeded-patient-${timestamp}@test.com`,
        name: 'Seeded',
        lastName: 'Patient',
        phone: `+5804${timestamp.toString().slice(-8)}`,
        password: hashedPassword,
        role: Role.PATIENT,
        patient: {
          create: {
            registeredByDoctorId: doctorId,
          },
        },
      },
    });
    seededPatientUserId = seededPatientUser.id;

    adminToken = await loginAndGetToken(adminUser.phone);
    doctorToken = await loginAndGetToken(doctorUser.phone);
    patientToken = await loginAndGetToken(patientUser.phone);
  }

  async function loginAndGetToken(phone: string): Promise<string> {
    const response = await request(getHttpServer())
      .post('/v1/auth/login')
      .send({ phone, password: 'test123' })
      .expect(201);

    const body = response.body as { data?: { accessToken?: string } };
    const token = body.data?.accessToken;

    if (!token) {
      throw new Error('No se pudo obtener token en setup RBAC e2e');
    }

    return token;
  }

  async function cleanupData() {
    await prisma.patient.deleteMany({
      where: {
        user: {
          phone: {
            in: createdPatientPhones,
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        phone: {
          in: createdPatientPhones,
        },
      },
    });

    await prisma.patient.deleteMany({
      where: {
        userId: {
          in: [seededPatientUserId],
        },
      },
    });

    await prisma.doctor.deleteMany({
      where: {
        id: doctorId,
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [adminUserId, doctorUserId, patientUserId, seededPatientUserId],
        },
      },
    });

    await prisma.specialty.deleteMany({ where: { id: specialtyId } });
  }

  function getHttpServer(): Parameters<typeof request>[0] {
    return app.getHttpServer() as Parameters<typeof request>[0];
  }

  it('debe permitir ADMIN en GET /v1/patients (2xx)', () => {
    return request(getHttpServer())
      .get('/v1/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('debe permitir DOCTOR en GET /v1/patients (2xx)', () => {
    return request(getHttpServer())
      .get('/v1/patients')
      .set('Authorization', `Bearer ${doctorToken}`)
      .expect(200);
  });

  it('debe denegar rol no permitido con 403', () => {
    return request(getHttpServer())
      .get('/v1/patients')
      .set('Authorization', `Bearer ${patientToken}`)
      .expect(403)
      .expect((res) => {
        const body = res.body as { status?: number; code?: string };
        expect(body.status).toBe(403);
        expect(body.code).toBeDefined();
      });
  });

  it('debe responder 401 cuando no hay token', () => {
    return request(getHttpServer())
      .get('/v1/patients')
      .expect(401)
      .expect((res) => {
        const body = res.body as { status?: number; code?: string };
        expect(body.status).toBe(401);
        expect(body.code).toBeDefined();
      });
  });

  it('debe denegar ADMIN en POST /v1/patients con 403', () => {
    const timestamp = Date.now();

    return request(getHttpServer())
      .post('/v1/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: `rbac2-post-admin-${timestamp}@test.com`,
        name: 'Post',
        lastName: 'Admin',
        phone: `+5805${timestamp.toString().slice(-8)}`,
        address: 'Calle 456',
      })
      .expect(403)
      .expect((res) => {
        const body = res.body as { status?: number; code?: string };
        expect(body.status).toBe(403);
        expect(body.code).toBeDefined();
      });
  });

  it('debe permitir DOCTOR en POST /v1/patients (201)', () => {
    const timestamp = Date.now();
    const phone = `+5806${timestamp.toString().slice(-8)}`;

    createdPatientPhones.push(phone);

    return request(getHttpServer())
      .post('/v1/patients')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        email: `rbac2-post-doctor-${timestamp}@test.com`,
        name: 'Post',
        lastName: 'Doctor',
        phone,
        address: 'Calle 789',
      })
      .expect(201)
      .expect((res) => {
        const body = res.body as { data?: { id?: string } };
        expect(body.data?.id).toBeDefined();
      });
  });

  it('debe mantener /v1/auth/login pública sin JWT', () => {
    return request(getHttpServer())
      .post('/v1/auth/login')
      .send({
        phone: doctorPhone,
        password: 'test123',
      })
      .expect(201)
      .expect((res) => {
        const body = res.body as { data?: { accessToken?: string } };
        expect(body.data?.accessToken).toBeDefined();
      });
  });
});
