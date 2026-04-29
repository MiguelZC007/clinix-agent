import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import type { PatientListResultDto } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UpdatePatientAntecedentsDto } from './dto/update-patient-antecedents.dto';
import { PatientResponseDto } from './dto/patient-response.dto';
import { PatientAntecedentsDto } from './dto/patient-antecedents.dto';
import type { PatientListQueryDto } from './dto/patient-list-query.dto';
import { Gender } from 'src/core/enum/gender.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ROLES_KEY } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enum/role.enum';
import type { PatientAccessScope } from './utils';

describe('PatientController', () => {
  let controller: PatientController;
  type MockPatientService = {
    create: jest.MockedFunction<
      (
        this: void,
        dto: CreatePatientDto,
        doctorId?: string,
      ) => Promise<PatientResponseDto>
    >;
    findAll: jest.MockedFunction<
      (
        this: void,
        query: PatientListQueryDto,
        scope: PatientAccessScope,
      ) => Promise<PatientListResultDto>
    >;
    findOne: jest.MockedFunction<
      (
        this: void,
        id: string,
        scope: PatientAccessScope,
      ) => Promise<PatientResponseDto>
    >;
    update: jest.MockedFunction<
      (
        this: void,
        id: string,
        dto: UpdatePatientDto,
        scope: PatientAccessScope,
      ) => Promise<PatientResponseDto>
    >;
    remove: jest.MockedFunction<
      (
        this: void,
        id: string,
        scope: PatientAccessScope,
      ) => Promise<{ deleted: true; id: string }>
    >;
    getAntecedents: jest.MockedFunction<
      (
        this: void,
        id: string,
        scope: PatientAccessScope,
      ) => Promise<PatientAntecedentsDto>
    >;
    updateAntecedents: jest.MockedFunction<
      (
        this: void,
        id: string,
        dto: UpdatePatientAntecedentsDto,
        scope: PatientAccessScope,
      ) => Promise<PatientAntecedentsDto>
    >;
  };

  let service: MockPatientService;

  const mockPatientResponse: PatientResponseDto = {
    id: 'patient-uuid',
    patientNumber: 1,
    email: 'test@example.com',
    name: 'Juan',
    lastName: 'Pérez',
    phone: '+584241234567',
    address: 'Calle 123',
    gender: Gender.MALE,
    birthDate: new Date('1990-05-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAntecedents: PatientAntecedentsDto = {
    patientId: 'patient-uuid',
    allergies: ['penicilina'],
    medications: ['aspirina'],
    medicalHistory: ['diabetes'],
    familyHistory: ['hipertensión'],
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockService: MockPatientService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      getAntecedents: jest.fn(),
      updateAntecedents: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientController],
      providers: [{ provide: PatientService, useValue: mockService }],
    }).compile();

    controller = module.get<PatientController>(PatientController);
    service = module.get(PatientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe llamar a patientService.create con el DTO y doctorId del usuario logueado', async () => {
      const createDto: CreatePatientDto = {
        email: 'test@example.com',
        name: 'Juan',
        lastName: 'Pérez',
        phone: '+584241234567',
        address: 'Calle 123',
        gender: Gender.MALE,
      };
      const mockUser = { doctor: { id: 'doctor-uuid' } };

      service.create.mockResolvedValue(mockPatientResponse);

      const result = await controller.create(createDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(createDto, 'doctor-uuid');
      expect(result).toEqual(mockPatientResponse);
    });

    it('debe restringir create solo a DOCTOR en metadata de método', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
        PatientController.prototype,
        'create',
      ) as TypedPropertyDescriptor<unknown> | undefined;

      const createHandler = descriptor?.value;
      const roles =
        typeof createHandler === 'function'
          ? (Reflect.getMetadata(ROLES_KEY, createHandler as object) as
              | Role[]
              | undefined)
          : undefined;

      expect(roles).toEqual([Role.DOCTOR]);
    });
  });

  describe('class decorators', () => {
    it('debe aplicar RolesGuard a nivel clase', () => {
      const guards =
        (Reflect.getMetadata(GUARDS_METADATA, PatientController) as
          | unknown[]
          | undefined) ?? [];

      expect(guards).toContain(RolesGuard);
    });

    it('debe permitir solo ADMIN y DOCTOR', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, PatientController) as
        | Role[]
        | undefined;

      expect(roles).toEqual([Role.ADMIN, Role.DOCTOR]);
    });
  });

  describe('findAll', () => {
    it('debe llamar a patientService.findAll con query y doctorId del usuario', async () => {
      const paginatedResult: PatientListResultDto = {
        items: [mockPatientResponse],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      };
      service.findAll.mockResolvedValue(paginatedResult);

      const query = { page: 1, pageSize: 10 };
      const mockUser = {
        role: Role.DOCTOR,
        doctor: { id: 'doctor-uuid' },
      };
      const result = await controller.findAll(query, mockUser);

      expect(service.findAll).toHaveBeenCalledWith(query, {
        role: Role.DOCTOR,
        doctorId: 'doctor-uuid',
      });
      expect(result).toEqual(paginatedResult);
      expect(result.items).toHaveLength(1);
    });

    it('debe pasar scope admin al service para búsquedas globales', async () => {
      const paginatedResult: PatientListResultDto = {
        items: [mockPatientResponse],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      };
      service.findAll.mockResolvedValue(paginatedResult);

      await controller.findAll({ page: 1, pageSize: 10 }, { role: Role.ADMIN });

      expect(service.findAll).toHaveBeenCalledWith(
        { page: 1, pageSize: 10 },
        { role: Role.ADMIN, doctorId: null },
      );
    });
  });

  describe('findOne', () => {
    it('debe llamar a patientService.findOne con el ID y doctorId', async () => {
      const mockUser = { role: Role.DOCTOR, doctor: { id: 'doctor-uuid' } };
      service.findOne.mockResolvedValue(mockPatientResponse);

      const result = await controller.findOne('patient-uuid', mockUser);

      expect(service.findOne).toHaveBeenCalledWith('patient-uuid', {
        role: Role.DOCTOR,
        doctorId: 'doctor-uuid',
      });
      expect(result).toEqual(mockPatientResponse);
    });
  });

  describe('update', () => {
    it('debe llamar a patientService.update con ID, DTO y doctorId', async () => {
      const mockUser = { role: Role.DOCTOR, doctor: { id: 'doctor-uuid' } };
      const updateDto: UpdatePatientDto = { name: 'Juan Carlos' };
      service.update.mockResolvedValue({
        ...mockPatientResponse,
        name: 'Juan Carlos',
      });

      const result = await controller.update(
        'patient-uuid',
        updateDto,
        mockUser,
      );

      expect(service.update).toHaveBeenCalledWith('patient-uuid', updateDto, {
        role: Role.DOCTOR,
        doctorId: 'doctor-uuid',
      });
      expect(result.name).toBe('Juan Carlos');
    });
  });

  describe('remove', () => {
    it('debe llamar a patientService.remove con el ID y doctorId', async () => {
      const mockUser = { role: Role.DOCTOR, doctor: { id: 'doctor-uuid' } };
      service.remove.mockResolvedValue({
        deleted: true,
        id: 'patient-uuid',
      });

      const result = await controller.remove('patient-uuid', mockUser);

      expect(service.remove).toHaveBeenCalledWith('patient-uuid', {
        role: Role.DOCTOR,
        doctorId: 'doctor-uuid',
      });
      expect(result).toEqual({ deleted: true, id: 'patient-uuid' });
    });
  });

  describe('getAntecedents', () => {
    it('debe llamar a patientService.getAntecedents con el ID y doctorId', async () => {
      const mockUser = { role: Role.DOCTOR, doctor: { id: 'doctor-uuid' } };
      service.getAntecedents.mockResolvedValue(mockAntecedents);

      const result = await controller.getAntecedents('patient-uuid', mockUser);

      expect(service.getAntecedents).toHaveBeenCalledWith('patient-uuid', {
        role: Role.DOCTOR,
        doctorId: 'doctor-uuid',
      });
      expect(result).toEqual(mockAntecedents);
    });
  });

  describe('updateAntecedents', () => {
    it('debe llamar a patientService.updateAntecedents con ID, DTO y doctorId', async () => {
      const mockUser = { role: Role.DOCTOR, doctor: { id: 'doctor-uuid' } };
      const updateDto: UpdatePatientAntecedentsDto = {
        allergies: ['penicilina', 'sulfas'],
      };
      service.updateAntecedents.mockResolvedValue({
        ...mockAntecedents,
        allergies: ['penicilina', 'sulfas'],
      });

      const result = await controller.updateAntecedents(
        'patient-uuid',
        updateDto,
        mockUser,
      );

      expect(service.updateAntecedents).toHaveBeenCalledWith(
        'patient-uuid',
        updateDto,
        { role: Role.DOCTOR, doctorId: 'doctor-uuid' },
      );
      expect(result.allergies).toEqual(['penicilina', 'sulfas']);
    });
  });
});
