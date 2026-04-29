import { OpenaiService } from 'src/modules/openai/openai.service';

jest.mock('src/core/config/environments', () => ({
  __esModule: true,
  default: {
    OPENAI_API_KEY: 'test-api-key',
    OPENAI_MODEL: 'gpt-4o-mini',
    SALT_ROUND: 10,
  },
}));

describe('OpenAI structure_anamnesis integration (e2e)', () => {
  let openaiService: OpenaiService;
  const structuringServiceMock = {
    structureAnamnesis: jest.fn(),
  };
  const clinicHistoryServiceMock = {
    create: jest.fn(),
    createWithoutAppointment: jest.fn(),
  };

  beforeEach(async () => {
    structuringServiceMock.structureAnamnesis.mockReset();
    clinicHistoryServiceMock.create.mockReset();
    clinicHistoryServiceMock.createWithoutAppointment.mockReset();

    openaiService = new OpenaiService(
      {
        user: {},
        patient: {},
        specialty: {},
        appointment: {},
        clinicHistory: {},
      } as never,
      {
        findDoctorByPhone: jest.fn(),
        getOrCreateActiveConversation: jest.fn(),
        preflightContextBudget: jest.fn(),
        addMessage: jest.fn(),
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

    await openaiService['executeToolFunction']('doctor-1', 'structure_anamnesis', {
      text: 'anamnesis whatsapp',
      mode: 'WITHOUT_APPOINTMENT',
      patientNumber: 10,
      specialtyCode: 20,
    });

    await openaiService['executeToolFunction']('doctor-1', 'structure_anamnesis', {
      text: 'anamnesis dashboard',
      mode: 'WITHOUT_APPOINTMENT',
      patientNumber: 11,
      specialtyCode: 21,
    });

    expect(structuringServiceMock.structureAnamnesis).toHaveBeenNthCalledWith(1, {
      text: 'anamnesis whatsapp',
      mode: 'WITHOUT_APPOINTMENT',
      patientRef: { patientId: undefined, patientNumber: 10 },
      specialtyRef: { specialtyId: undefined, specialtyCode: 20 },
    });
    expect(structuringServiceMock.structureAnamnesis).toHaveBeenNthCalledWith(2, {
      text: 'anamnesis dashboard',
      mode: 'WITHOUT_APPOINTMENT',
      patientRef: { patientId: undefined, patientNumber: 11 },
      specialtyRef: { specialtyId: undefined, specialtyCode: 21 },
    });
  });

  it('no persiste historia clínica cuando la estructuración falla', async () => {
    structuringServiceMock.structureAnamnesis.mockResolvedValue({
      ok: false,
      error: {
        category: 'SEMANTIC_VALIDATION',
        code: 'DTO_VALIDATION_FAILED',
        message: 'invalid',
      },
    });

    const result = await openaiService['executeToolFunction'](
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
        code: 'DTO_VALIDATION_FAILED',
        message: 'invalid',
      },
    });
    expect(clinicHistoryServiceMock.create).not.toHaveBeenCalled();
    expect(clinicHistoryServiceMock.createWithoutAppointment).not.toHaveBeenCalled();
  });
});
