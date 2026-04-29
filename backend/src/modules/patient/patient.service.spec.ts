import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createMockPrismaService,
  MockPrismaService,
} from 'src/prisma/__mocks__/prisma.service.mock';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UpdatePatientAntecedentsDto } from './dto/update-patient-antecedents.dto';
import { Gender } from 'src/core/enum/gender.enum';
import { Role } from 'src/core/enum/role.enum';
import type { PatientAccessScope } from './utils';

describe('PatientService', () => {
  let service: PatientService;
  let prisma: MockPrismaService;

  const mockUser = {
    id: 'user-uuid',
    email: 'test@example.com',
    name: 'Juan',
    lastName: 'Pérez',
    phone: '+584241234567',
    password: 'hashed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPatient = {
    id: 'patient-uuid',
    userId: 'user-uuid',
    patientNumber: 1,
    registeredByDoctorId: 'doctor-uuid',
    gender: 'male',
    birthDate: new Date('1990-05-15'),
    address: 'Calle 123',
    allergies: ['penicilina'],
    medications: ['aspirina'],
    medicalHistory: ['diabetes'],
    familyHistory: ['hipertensión'],
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
  };

  const doctorScope: PatientAccessScope = {
    role: Role.DOCTOR,
    doctorId: 'doctor-uuid',
  };

  const adminScope: PatientAccessScope = {
    role: Role.ADMIN,
    doctorId: null,
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PatientService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<PatientService>(PatientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreatePatientDto = {
      email: 'test@example.com',
      name: 'Juan',
      lastName: 'Pérez',
      phone: '+584241234567',
      password: 'password123',
      address: 'Calle 123',
      gender: Gender.MALE,
      birthDate: '1990-05-15',
    };

    it('debe crear un paciente exitosamente', async () => {
      // Mock $transaction callback form
      prisma.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            user: {
              findFirst: prisma.user.findFirst,
              create: prisma.user.create,
            },
          };
          return callback(tx);
        },
      );
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        ...mockUser,
        patient: mockPatient,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(createDto.email);
      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el email ya existe', async () => {
      prisma.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            user: {
              findFirst: prisma.user.findFirst,
              create: prisma.user.create,
            },
          };
          return callback(tx);
        },
      );
      prisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe incluir registeredByDoctorId cuando se pasa doctorId', async () => {
      prisma.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            user: {
              findFirst: prisma.user.findFirst,
              create: prisma.user.create,
            },
          };
          return callback(tx);
        },
      );
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        ...mockUser,
        patient: mockPatient,
      });

      await service.create(createDto, 'doctor-uuid');

      const createCalls = prisma.user.create.mock.calls as Array<
        [
          {
            data?: {
              patient?: {
                create?: {
                  registeredByDoctorId?: string;
                };
              };
            };
          },
        ]
      >;
      const createCall = createCalls[0]?.[0];

      expect(createCall?.data?.patient?.create?.registeredByDoctorId).toBe(
        'doctor-uuid',
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar lista paginada de todos los pacientes', async () => {
      prisma.$transaction.mockImplementation((queries: Promise<unknown>[]) =>
        Promise.all(queries),
      );
      prisma.patient.findMany.mockResolvedValue([mockPatient]);
      prisma.patient.count.mockResolvedValue(1);

      const result = await service.findAll({}, doctorScope);

      expect(result.items).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { registeredByDoctorId: 'doctor-uuid' },
        }),
      );
    });

    it('debe retornar lista vacía si no hay pacientes', async () => {
      prisma.$transaction.mockImplementation((queries: Promise<unknown>[]) =>
        Promise.all(queries),
      );
      prisma.patient.findMany.mockResolvedValue([]);
      prisma.patient.count.mockResolvedValue(0);

      const result = await service.findAll(
        { page: 1, pageSize: 10 },
        doctorScope,
      );

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('debe aplicar filtro de búsqueda', async () => {
      prisma.$transaction.mockImplementation((queries: Promise<unknown>[]) =>
        Promise.all(queries),
      );
      prisma.patient.findMany.mockResolvedValue([mockPatient]);
      prisma.patient.count.mockResolvedValue(1);

      const result = await service.findAll(
        { page: 1, pageSize: 10, search: 'Juan' },
        doctorScope,
      );
      const findManyCalls = prisma.patient.findMany.mock.calls as Array<
        [
          {
            where?: {
              user?: {
                OR?: unknown[];
              };
            };
          },
        ]
      >;
      const findManyCall = findManyCalls[0]?.[0];

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(Array.isArray(findManyCall?.where?.user?.OR)).toBe(true);
    });

    it('debe omitir filtro de ownership para ADMIN', async () => {
      prisma.$transaction.mockImplementation((queries: Promise<unknown>[]) =>
        Promise.all(queries),
      );
      prisma.patient.findMany.mockResolvedValue([mockPatient]);
      prisma.patient.count.mockResolvedValue(1);

      await service.findAll({ page: 1, pageSize: 10 }, adminScope);

      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });

  describe('findOne', () => {
    it('debe retornar un paciente por ID', async () => {
      prisma.patient.findUnique.mockResolvedValue(mockPatient);

      const result = await service.findOne('patient-uuid', doctorScope);

      expect(result).toBeDefined();
      expect(result.id).toBe('patient-uuid');
    });

    it('debe lanzar NotFoundException si el paciente no existe', async () => {
      prisma.patient.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('invalid-uuid', doctorScope),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ForbiddenException si DOCTOR consulta paciente ajeno', async () => {
      prisma.patient.findUnique.mockResolvedValue({
        ...mockPatient,
        registeredByDoctorId: 'other-doctor',
      });

      await expect(
        service.findOne('patient-uuid', doctorScope),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe permitir acceso de ADMIN a paciente de otro doctor', async () => {
      prisma.patient.findUnique.mockResolvedValue({
        ...mockPatient,
        registeredByDoctorId: 'other-doctor',
      });

      const result = await service.findOne('patient-uuid', adminScope);

      expect(result.id).toBe('patient-uuid');
    });
  });

  describe('update', () => {
    const updateDto: UpdatePatientDto = {
      name: 'Juan Carlos',
      address: 'Calle 456',
    };

    it('debe actualizar un paciente exitosamente', async () => {
      prisma.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            patient: {
              findUnique: prisma.patient.findUnique,
              update: prisma.patient.update,
            },
            user: {
              findFirst: prisma.user.findFirst,
            },
          };
          return callback(tx);
        },
      );
      prisma.patient.findUnique.mockResolvedValue(mockPatient);
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.patient.update.mockResolvedValue({
        ...mockPatient,
        address: 'Calle 456',
        user: { ...mockUser, name: 'Juan Carlos' },
      });

      const result = await service.update(
        'patient-uuid',
        updateDto,
        doctorScope,
      );

      expect(result.name).toBe('Juan Carlos');
    });

    it('debe lanzar NotFoundException si el paciente no existe', async () => {
      prisma.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            patient: {
              findUnique: prisma.patient.findUnique,
              update: prisma.patient.update,
            },
            user: {
              findFirst: prisma.user.findFirst,
            },
          };
          return callback(tx);
        },
      );
      prisma.patient.findUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid-uuid', updateDto, doctorScope),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si el email ya está en uso', async () => {
      prisma.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            patient: {
              findUnique: prisma.patient.findUnique,
              update: prisma.patient.update,
            },
            user: {
              findFirst: prisma.user.findFirst,
            },
          };
          return callback(tx);
        },
      );
      prisma.patient.findUnique.mockResolvedValue(mockPatient);
      prisma.user.findFirst.mockResolvedValue({ id: 'other-user' });

      await expect(
        service.update(
          'patient-uuid',
          { email: 'other@example.com' },
          doctorScope,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('debe permitir actualización con ADMIN aunque el paciente sea de otro doctor', async () => {
      prisma.$transaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            patient: {
              findUnique: prisma.patient.findUnique,
              update: prisma.patient.update,
            },
            user: {
              findFirst: prisma.user.findFirst,
            },
          };
          return callback(tx);
        },
      );
      prisma.patient.findUnique.mockResolvedValue({
        ...mockPatient,
        registeredByDoctorId: 'other-doctor',
      });
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.patient.update.mockResolvedValue(mockPatient);

      await service.update('patient-uuid', { name: 'Admin Edit' }, adminScope);

      expect(prisma.patient.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debe eliminar un paciente exitosamente', async () => {
      prisma.patient.findUnique.mockResolvedValue(mockPatient);
      prisma.$transaction.mockResolvedValue([null, null] as never);

      const result = await service.remove('patient-uuid', doctorScope);

      expect(result).toEqual({ deleted: true, id: 'patient-uuid' });
    });

    it('debe lanzar NotFoundException si el paciente no existe', async () => {
      prisma.patient.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-uuid', doctorScope)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar ForbiddenException si DOCTOR intenta eliminar paciente ajeno', async () => {
      prisma.patient.findUnique.mockResolvedValue({
        ...mockPatient,
        registeredByDoctorId: 'other-doctor',
      });

      await expect(service.remove('patient-uuid', doctorScope)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getAntecedents', () => {
    it('debe retornar los antecedentes del paciente', async () => {
      prisma.patient.findUnique.mockResolvedValue(mockPatient);

      const result = await service.getAntecedents('patient-uuid', doctorScope);

      expect(result.allergies).toEqual(['penicilina']);
      expect(result.medications).toEqual(['aspirina']);
    });

    it('debe lanzar NotFoundException si el paciente no existe', async () => {
      prisma.patient.findUnique.mockResolvedValue(null);

      await expect(
        service.getAntecedents('invalid-uuid', doctorScope),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe permitir antecedentes con ADMIN para paciente ajeno', async () => {
      prisma.patient.findUnique.mockResolvedValue({
        ...mockPatient,
        registeredByDoctorId: 'other-doctor',
      });

      const result = await service.getAntecedents('patient-uuid', adminScope);

      expect(result.patientId).toBe('patient-uuid');
    });
  });

  describe('updateAntecedents', () => {
    const updateAntecedentsDto: UpdatePatientAntecedentsDto = {
      allergies: ['penicilina', 'sulfas'],
    };

    it('debe actualizar los antecedentes exitosamente', async () => {
      prisma.patient.findUnique.mockResolvedValue(mockPatient);
      prisma.patient.update.mockResolvedValue({
        ...mockPatient,
        allergies: ['penicilina', 'sulfas'],
      });

      const result = await service.updateAntecedents(
        'patient-uuid',
        updateAntecedentsDto,
        doctorScope,
      );

      expect(result.allergies).toEqual(['penicilina', 'sulfas']);
    });

    it('debe lanzar NotFoundException si el paciente no existe', async () => {
      prisma.patient.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAntecedents(
          'invalid-uuid',
          updateAntecedentsDto,
          doctorScope,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ForbiddenException si DOCTOR actualiza antecedentes de paciente ajeno', async () => {
      prisma.patient.findUnique.mockResolvedValue({
        ...mockPatient,
        registeredByDoctorId: 'other-doctor',
      });

      await expect(
        service.updateAntecedents(
          'patient-uuid',
          updateAntecedentsDto,
          doctorScope,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
