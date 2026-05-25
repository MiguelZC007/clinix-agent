/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  createMockPrismaService,
  MockPrismaService,
} from 'src/prisma/__mocks__/prisma.service.mock';
import { PrismaService } from 'src/prisma/prisma.service';
import { PdfService } from './pdf.service';

describe('PdfService', () => {
  let service: PdfService;
  let prisma: MockPrismaService;
  const originalFetch = global.fetch;
  const originalUrl = process.env.GOTENBERG_URL;

  const clinicHistoryRecord = {
    id: 'clinic-history-uuid',
    doctorId: 'doctor-uuid',
    consultationReason: 'Dolor de cabeza',
    symptoms: ['dolor', 'mareos'],
    treatment: 'Reposo y medicación',
    createdAt: new Date('2026-01-15T10:00:00.000Z'),
    patient: {
      patientNumber: 12,
      user: { name: 'Juan', lastName: 'Pérez' },
    },
    doctor: {
      user: { name: 'María', lastName: 'González' },
      specialty: { name: 'Cardiología' },
    },
    diagnostics: [{ name: 'Migraña', description: 'Dolor de cabeza crónico' }],
    physicalExams: [{ name: 'Examen neurológico', description: 'Normal' }],
    vitalSigns: [{ name: 'Presión arterial', value: '120/80', unit: 'mmHg' }],
    prescription: {
      name: 'Tratamiento base',
      description: 'Control ambulatorio',
      prescriptionMedications: [
        {
          name: 'Paracetamol',
          quantity: 10,
          unit: 'tabletas',
          frequency: 'Cada 8 horas',
          duration: '5 días',
          administrationRoute: 'Oral',
          indications: 'Tomar después de comer',
        },
      ],
    },
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<PdfService>(PdfService);
    process.env.GOTENBERG_URL = 'http://gotenberg:3000';
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
    if (originalUrl) {
      process.env.GOTENBERG_URL = originalUrl;
    } else {
      delete process.env.GOTENBERG_URL;
    }
  });

  it('genera PDF cuando la historia existe y pertenece al doctor', async () => {
    prisma.clinicHistory.findUnique.mockResolvedValue(clinicHistoryRecord);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
    }) as typeof fetch;

    const result = await service.generateClinicHistoryPdf(
      'clinic-history-uuid',
      'doctor-uuid',
    );

    expect(result).toBeInstanceOf(Buffer);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://gotenberg:3000/forms/chromium/convert/html',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('lanza NotFoundException si no existe la historia', async () => {
    prisma.clinicHistory.findUnique.mockResolvedValue(null);

    await expect(
      service.generateClinicHistoryPdf('missing', 'doctor-uuid'),
    ).rejects.toThrow(NotFoundException);
  });

  it('lanza ForbiddenException si la historia no pertenece al doctor', async () => {
    prisma.clinicHistory.findUnique.mockResolvedValue({
      ...clinicHistoryRecord,
      doctorId: 'other-doctor',
    });

    await expect(
      service.generateClinicHistoryPdf('clinic-history-uuid', 'doctor-uuid'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lanza InternalServerErrorException si falta GOTENBERG_URL', async () => {
    prisma.clinicHistory.findUnique.mockResolvedValue(clinicHistoryRecord);
    delete process.env.GOTENBERG_URL;

    await expect(
      service.generateClinicHistoryPdf('clinic-history-uuid', 'doctor-uuid'),
    ).rejects.toThrow(InternalServerErrorException);
  });
});
