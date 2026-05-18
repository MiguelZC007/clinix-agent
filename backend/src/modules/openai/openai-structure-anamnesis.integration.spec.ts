import { OpenaiService } from 'src/modules/openai/openai.service';

interface PersistedHistoryDto {
  consultationReason: string;
  diagnostics: Array<{ name: string }>;
  patientNumber: number;
  specialtyCode: number;
}

jest.mock('src/core/config/environments', () => ({
  __esModule: true,
  default: {
    OPENAI_API_KEY: 'test-api-key',
    OPENAI_MODEL: 'gpt-4o-mini',
    SALT_ROUND: 10,
  },
}));

describe('OpenAI structure_anamnesis integration', () => {
  let openaiService: OpenaiService;
  const prismaMock = {
    user: {},
    patient: { findUnique: jest.fn() },
    specialty: { findUnique: jest.fn() },
    appointment: { findUnique: jest.fn() },
    clinicHistory: {},
  };
  const structuringServiceMock = {
    structureAnamnesis: jest.fn(),
  };
  const clinicHistoryServiceMock = {
    create: jest.fn(),
    createWithoutAppointment: jest.fn<
      Promise<{ id: string; consultationReason: string }>,
      [string, PersistedHistoryDto]
    >(),
  };

  beforeEach(() => {
    structuringServiceMock.structureAnamnesis.mockReset();
    clinicHistoryServiceMock.create.mockReset();
    clinicHistoryServiceMock.createWithoutAppointment.mockReset();
    prismaMock.patient.findUnique.mockReset();
    prismaMock.specialty.findUnique.mockReset();
    prismaMock.appointment.findUnique.mockReset();

    openaiService = new OpenaiService(
      prismaMock as never,
      {
        findDoctorByPhone: jest.fn(),
        getOrCreateActiveConversation: jest.fn(),
        preflightContextBudget: jest.fn(),
        addMessage: jest.fn(),
        saveStructuredDraft: jest.fn(),
      } as never,
      { findTodaysByDoctor: jest.fn() } as never,
      clinicHistoryServiceMock as never,
      structuringServiceMock as never,
    );
  });

  it('reutiliza el mismo contrato para flujos WhatsApp y dashboard', async () => {
    structuringServiceMock.structureAnamnesis.mockResolvedValue({
      ok: true,
      data: { consultationReason: 'ok' },
    });

    await openaiService['executeToolFunction'](
      'conversation-1',
      'doctor-1',
      'structure_anamnesis',
      {
        text: 'anamnesis whatsapp',
        mode: 'WITHOUT_APPOINTMENT',
        patientNumber: 10,
        specialtyCode: 20,
      },
    );

    await openaiService['executeToolFunction'](
      'conversation-1',
      'doctor-1',
      'structure_anamnesis',
      {
        text: 'anamnesis dashboard',
        mode: 'WITHOUT_APPOINTMENT',
        patientNumber: 11,
        specialtyCode: 21,
      },
    );

    expect(structuringServiceMock.structureAnamnesis).toHaveBeenNthCalledWith(
      1,
      {
        text: 'anamnesis whatsapp',
        mode: 'WITHOUT_APPOINTMENT',
        patientRef: { patientId: undefined, patientNumber: 10 },
        specialtyRef: { specialtyId: undefined, specialtyCode: 20 },
      },
    );
    expect(structuringServiceMock.structureAnamnesis).toHaveBeenNthCalledWith(
      2,
      {
        text: 'anamnesis dashboard',
        mode: 'WITHOUT_APPOINTMENT',
        patientRef: { patientId: undefined, patientNumber: 11 },
        specialtyRef: { specialtyId: undefined, specialtyCode: 21 },
      },
    );
  });

  it('no persiste historia clínica cuando la estructuración falla', async () => {
    structuringServiceMock.structureAnamnesis.mockResolvedValue({
      ok: false,
      error: {
        category: 'SEMANTIC_VALIDATION',
        code: 'SEMANTIC_RULES_FAILED',
        message: 'invalid',
        fields: ['diagnostics[0].name'],
        details: [
          {
            path: 'diagnostics[0].name',
            message: 'El diagnóstico contiene contenido no informativo.',
          },
        ],
      },
    });

    const result = await openaiService['executeToolFunction'](
      'conversation-1',
      'doctor-1',
      'structure_anamnesis',
      {
        text: 'anamnesis inconsistente',
        mode: 'WITH_APPOINTMENT',
      },
    );

    expect(result).toEqual({
      ok: false,
      error: {
        category: 'SEMANTIC_VALIDATION',
        code: 'SEMANTIC_RULES_FAILED',
        message: 'invalid',
        fields: ['diagnostics[0].name'],
        details: [
          {
            path: 'diagnostics[0].name',
            message: 'El diagnóstico contiene contenido no informativo.',
          },
        ],
      },
    });
    expect(clinicHistoryServiceMock.create).not.toHaveBeenCalled();
    expect(
      clinicHistoryServiceMock.createWithoutAppointment,
    ).not.toHaveBeenCalled();
  });

  it('ejecuta flujo exitoso completo: estructurar y luego persistir historia clínica', async () => {
    structuringServiceMock.structureAnamnesis.mockResolvedValue({
      ok: true,
      data: {
        consultationReason: 'Disnea de esfuerzo progresiva en 48 horas',
        symptoms: ['disnea', 'tos seca'],
        treatment: 'Nebulizaciones y control clínico en 24 horas',
        diagnostics: [
          { name: 'Bronquitis aguda', description: 'sin foco neumónico' },
        ],
        physicalExams: [
          { name: 'Auscultación', description: 'sibilancias difusas' },
        ],
        vitalSigns: [
          { name: 'SpO2', value: '96', unit: '%', measurement: 'reposo' },
        ],
      },
    });
    prismaMock.patient.findUnique.mockResolvedValue({
      id: 'patient-uuid-1',
      registeredByDoctorId: 'doctor-1',
    });
    prismaMock.specialty.findUnique.mockResolvedValue({
      id: 'specialty-uuid-1',
      specialtyCode: 20,
    });
    clinicHistoryServiceMock.createWithoutAppointment.mockResolvedValue({
      id: 'history-1',
      consultationReason: 'Disnea de esfuerzo progresiva en 48 horas',
    });

    const structured = await openaiService['executeToolFunction'](
      'conversation-1',
      'doctor-1',
      'structure_anamnesis',
      {
        text: 'Paciente con disnea de esfuerzo y tos seca',
        mode: 'WITHOUT_APPOINTMENT',
        patientNumber: 10,
        specialtyCode: 20,
      },
    );

    const persistenceResult = (await openaiService['executeToolFunction'](
      'conversation-1',
      'doctor-1',
      'create_clinic_history',
      {
        ...(structured as { ok: true; data: Record<string, unknown> }).data,
        patientNumber: 10,
        specialtyCode: 20,
      },
    )) as { id: string; consultationReason: string };

    expect((structured as { ok: boolean }).ok).toBe(true);
    expect(
      clinicHistoryServiceMock.createWithoutAppointment,
    ).toHaveBeenCalledTimes(1);
    const persistedDto =
      clinicHistoryServiceMock.createWithoutAppointment.mock.calls[0]?.[1];

    expect(persistedDto).toBeDefined();
    if (!persistedDto) {
      throw new Error('persistedDto should be defined');
    }
    expect(persistedDto.consultationReason).toBe(
      'Disnea de esfuerzo progresiva en 48 horas',
    );
    expect(persistedDto.diagnostics[0]?.name).toBe('Bronquitis aguda');
    expect(persistedDto.patientNumber).toBe(10);
    expect(persistedDto.specialtyCode).toBe(20);
    expect(persistenceResult).toEqual({
      id: 'history-1',
      consultationReason: 'Disnea de esfuerzo progresiva en 48 horas',
    });
  });
});
