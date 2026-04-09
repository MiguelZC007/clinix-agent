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

jest.mock('src/core/config/environments', () => ({
  __esModule: true,
  default: {
    OPENAI_API_KEY: 'test-api-key',
    OPENAI_MODEL: 'gpt-4',
    SALT_ROUND: 10,
  },
}));

import { ContextBudgetExceededError } from './conversation.service';
import { OpenaiService } from './openai.service';

interface MockPrisma {
  user: { create: jest.Mock; findFirst: jest.Mock };
  patient: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  specialty: { findMany: jest.Mock; findUnique: jest.Mock };
  appointment: {
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  clinicHistory: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
  };
}

interface MockConversationService {
  findDoctorByPhone: jest.Mock;
  getOrCreateActiveConversation: jest.Mock;
  preflightContextBudget: jest.Mock;
  addMessage: jest.Mock;
}

interface MockClinicHistoryService {
  create: jest.Mock;
  createWithoutAppointment: jest.Mock;
}

describe('OpenaiService budget preflight', () => {
  let service: OpenaiService;
  let prisma: MockPrisma;
  let conversationService: MockConversationService;

  const mockConversation = {
    id: 'conversation-uuid',
    doctorId: 'doctor-uuid',
    model: 'gpt-4',
    systemPrompt: 'Prompt',
  };

  beforeEach(() => {
    mockChatCompletionsCreate.mockReset();

    prisma = {
      user: { create: jest.fn(), findFirst: jest.fn() },
      patient: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      specialty: { findMany: jest.fn(), findUnique: jest.fn() },
      appointment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      clinicHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    conversationService = {
      findDoctorByPhone: jest
        .fn()
        .mockResolvedValue({ doctorId: 'doctor-uuid', doctorName: 'Dr. Test' }),
      getOrCreateActiveConversation: jest
        .fn()
        .mockResolvedValue({ conversation: mockConversation, messages: [] }),
      preflightContextBudget: jest.fn().mockResolvedValue({
        conversation: { ...mockConversation, messages: [] },
        messages: [{ role: 'user', content: 'Hola doctor' }],
        contextTokensUsed: 1200,
        contextTokenLimit: 32000,
        contextTokenLimitOverride: null,
      }),
      addMessage: jest.fn().mockResolvedValue({ id: 'msg-1' }),
    };

    service = new OpenaiService(
      prisma as never,
      conversationService as never,
      { findTodaysByDoctor: jest.fn() } as never,
      {
        create: jest.fn(),
        createWithoutAppointment: jest.fn(),
      } as never,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('invoca preflight antes de la completion inicial y antes de cada follow-up con tools', async () => {
    conversationService.preflightContextBudget
      .mockResolvedValueOnce({
        conversation: { ...mockConversation, messages: [] },
        messages: [{ role: 'user', content: 'Hola doctor' }],
        contextTokensUsed: 1200,
        contextTokenLimit: 32000,
        contextTokenLimitOverride: null,
      })
      .mockResolvedValueOnce({
        conversation: { ...mockConversation, summary: 'Resumen actualizado' },
        messages: [
          {
            role: 'system',
            content:
              'Resumen de la conversación anterior:\nResumen actualizado',
          },
          { role: 'user', content: 'Contexto compacto vigente' },
        ],
        contextTokensUsed: 900,
        contextTokenLimit: 32000,
        contextTokenLimitOverride: null,
      });

    mockChatCompletionsCreate
      .mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: 'call-1',
                  type: 'function',
                  function: { name: 'list_specialties', arguments: '{}' },
                },
              ],
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          { message: { content: 'Respuesta final', tool_calls: null } },
        ],
      });
    prisma.specialty.findMany.mockResolvedValue([
      { id: 'spec-1', name: 'Cardiología', specialtyCode: 1 },
    ]);

    const result = await service.processMessageFromDoctor(
      '+584241234567',
      'Necesito las especialidades',
    );

    expect(result).toBe('Respuesta final');
    expect(conversationService.preflightContextBudget).toHaveBeenCalledTimes(2);
    expect(conversationService.preflightContextBudget).toHaveBeenNthCalledWith(
      1,
      'conversation-uuid',
    );
    expect(conversationService.preflightContextBudget).toHaveBeenNthCalledWith(
      2,
      'conversation-uuid',
      expect.any(Array),
    );
    const secondPreflightArgs = conversationService.preflightContextBudget.mock
      .calls[1] as [
      string,
      Array<{ role: string; content: string | null; metadata?: string }>,
    ];
    const pendingPayload = secondPreflightArgs[1];
    const pendingAssistantMessage = pendingPayload.find(
      (message) => message.role === 'assistant',
    );
    const pendingToolMessage = pendingPayload.find(
      (message) => message.role === 'tool',
    );

    expect(pendingAssistantMessage).toBeDefined();
    expect(pendingAssistantMessage?.content).toBeNull();
    expect(pendingAssistantMessage?.metadata).toContain('list_specialties');
    expect(pendingToolMessage).toBeDefined();
    expect(pendingToolMessage?.content).toBe(
      JSON.stringify([{ id: 'spec-1', name: 'Cardiología', specialtyCode: 1 }]),
    );
    expect(pendingToolMessage?.metadata).toContain('call-1');
    const secondCall = mockChatCompletionsCreate.mock.calls.at(1) as unknown;
    const [secondRequest] = secondCall as [
      {
        messages: Array<{
          role: string;
          content?: string | null;
          tool_calls?: unknown;
          tool_call_id?: string;
        }>;
      },
    ];

    expect(secondRequest.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'system',
          content: 'Resumen de la conversación anterior:\nResumen actualizado',
        }),
        expect.objectContaining({
          role: 'user',
          content: 'Contexto compacto vigente',
        }),
      ]),
    );
    expect(secondRequest.messages).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'user',
          content: 'Hola doctor',
        }),
      ]),
    );
    const followUpAssistantMessage = secondRequest.messages.find(
      (message) =>
        message.role === 'assistant' && Array.isArray(message.tool_calls),
    );
    const followUpToolMessage = secondRequest.messages.find(
      (message) => message.role === 'tool' && message.tool_call_id === 'call-1',
    );

    expect(followUpAssistantMessage).toBeDefined();
    expect(followUpAssistantMessage?.content).toBeNull();
    expect(followUpAssistantMessage?.tool_calls).toHaveLength(1);
    expect(
      (
        followUpAssistantMessage?.tool_calls as Array<{
          id: string;
          function: { name: string };
        }>
      )[0],
    ).toMatchObject({
      id: 'call-1',
      function: { name: 'list_specialties' },
    });
    expect(followUpToolMessage).toBeDefined();
    expect(followUpToolMessage?.content).toBe(
      JSON.stringify([{ id: 'spec-1', name: 'Cardiología', specialtyCode: 1 }]),
    );
  });

  it('devuelve fallback controlado y evita llamar OpenAI si el budget no entra', async () => {
    conversationService.preflightContextBudget.mockRejectedValue(
      new ContextBudgetExceededError(),
    );

    const result = await service.processMessageFromDoctor(
      '+584241234567',
      'Traé todo el historial',
    );

    expect(result).toContain('no entra de forma segura');
    expect(mockChatCompletionsCreate).not.toHaveBeenCalled();
  });
});

describe('OpenaiService clinic history prescription mapping', () => {
  let service: OpenaiService;
  let prisma: MockPrisma;
  let clinicHistoryService: MockClinicHistoryService;

  const createService = () => {
    prisma = {
      user: { create: jest.fn(), findFirst: jest.fn() },
      patient: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      specialty: { findMany: jest.fn(), findUnique: jest.fn() },
      appointment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      clinicHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    clinicHistoryService = {
      create: jest.fn(),
      createWithoutAppointment: jest.fn(),
    };

    return new OpenaiService(
      prisma as never,
      {
        findDoctorByPhone: jest.fn(),
        getOrCreateActiveConversation: jest.fn(),
        preflightContextBudget: jest.fn(),
        addMessage: jest.fn(),
      } as never,
      { findTodaysByDoctor: jest.fn() } as never,
      clinicHistoryService as never,
    );
  };

  const createBaseClinicHistoryArgs = () => ({
    consultationReason: 'Dolor persistente desde hace varios dias',
    symptoms: ['dolor de cabeza'],
    treatment: 'Reposo, hidratacion y analgesicos por siete dias',
    diagnostics: [],
    physicalExams: [],
    vitalSigns: [],
  });

  beforeEach(() => {
    service = createService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('mapCreateClinicHistoryArgsToDto()', () => {
    it('normaliza la receta manteniendo coerciones y descripcion opcional', async () => {
      const dto = await service['mapCreateClinicHistoryArgsToDto']({
        ...createBaseClinicHistoryArgs(),
        appointmentId: '550e8400-e29b-41d4-a716-446655440003',
        prescription: {
          name: 123,
          description: false,
          medications: [
            {
              name: 'Ibuprofeno',
              quantity: '2.9',
              unit: 10,
              frequency: 'Cada 8 horas',
              duration: '5 dias',
              indications: true,
              administrationRoute: 'oral',
              description: 456,
            },
            {
              name: 'Paracetamol',
              quantity: '1.2',
              unit: 'tabletas',
              frequency: 'Cada 12 horas',
              duration: '3 dias',
              indications: 'Despues de comer',
              administrationRoute: 'oral',
            },
          ],
        },
      });

      expect(dto.prescription).toEqual({
        name: '123',
        description: 'false',
        medications: [
          {
            name: 'Ibuprofeno',
            quantity: 2,
            unit: '10',
            frequency: 'Cada 8 horas',
            duration: '5 dias',
            indications: 'true',
            administrationRoute: 'oral',
            description: '456',
          },
          {
            name: 'Paracetamol',
            quantity: 1,
            unit: 'tabletas',
            frequency: 'Cada 12 horas',
            duration: '3 dias',
            indications: 'Despues de comer',
            administrationRoute: 'oral',
            description: undefined,
          },
        ],
      });
    });

    it.each([
      ['missing', undefined],
      ['non-object', 'ibuprofeno'],
      ['missing medications array', { name: 'Plan' }],
    ])(
      'omite prescription cuando el contenedor es %s',
      async (_label, prescription) => {
        const dto = await service['mapCreateClinicHistoryArgsToDto']({
          ...createBaseClinicHistoryArgs(),
          appointmentId: '550e8400-e29b-41d4-a716-446655440003',
          prescription,
        });

        expect(dto.prescription).toBeUndefined();
      },
    );

    it('envia al clinicHistoryService el dto normalizado en el flujo con cita', async () => {
      prisma.appointment.findUnique.mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440003',
        doctorId: 'doctor-uuid',
      });
      clinicHistoryService.create.mockResolvedValue({ id: 'history-1' });

      const result = await service['executeToolFunction'](
        'doctor-uuid',
        'create_clinic_history',
        {
          ...createBaseClinicHistoryArgs(),
          appointmentId: '550e8400-e29b-41d4-a716-446655440003',
          prescription: {
            name: 123,
            description: false,
            medications: [
              {
                name: 'Ibuprofeno',
                quantity: '2.9',
                unit: 10,
                frequency: 'Cada 8 horas',
                duration: '5 dias',
                indications: true,
                administrationRoute: 'oral',
                description: 456,
              },
            ],
          },
        },
      );

      expect(clinicHistoryService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: '550e8400-e29b-41d4-a716-446655440003',
          consultationReason: 'Dolor persistente desde hace varios dias',
          treatment: 'Reposo, hidratacion y analgesicos por siete dias',
          symptoms: ['dolor de cabeza'],
          prescription: {
            name: '123',
            description: 'false',
            medications: [
              {
                name: 'Ibuprofeno',
                quantity: 2,
                unit: '10',
                frequency: 'Cada 8 horas',
                duration: '5 dias',
                indications: 'true',
                administrationRoute: 'oral',
                description: '456',
              },
            ],
          },
        }),
        'doctor-uuid',
      );
      expect(result).toEqual({ id: 'history-1' });
    });
  });

  describe('mapCreateClinicHistoryArgsToDtoWithoutAppointment()', () => {
    it('normaliza la receta sin alterar los identificadores numericos', async () => {
      const dto = await service[
        'mapCreateClinicHistoryArgsToDtoWithoutAppointment'
      ](
        {
          ...createBaseClinicHistoryArgs(),
          prescription: {
            name: 'Receta 1',
            description: 789,
            medications: [
              {
                name: 999,
                quantity: 4.8,
                unit: 'ml',
                frequency: false,
                duration: 5,
                indications: 'Despues del almuerzo',
                administrationRoute: 'intravenosa',
              },
            ],
          },
        },
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        77,
        11,
      );

      expect(dto.patientNumber).toBe(77);
      expect(dto.specialtyCode).toBe(11);
      expect(dto.patientId).toBeUndefined();
      expect(dto.specialtyId).toBeUndefined();
      expect(dto.prescription).toEqual({
        name: 'Receta 1',
        description: '789',
        medications: [
          {
            name: '999',
            quantity: 4,
            unit: 'ml',
            frequency: 'false',
            duration: '5',
            indications: 'Despues del almuerzo',
            administrationRoute: 'intravenosa',
            description: undefined,
          },
        ],
      });
    });

    it.each([
      ['missing', undefined],
      ['non-object', 123],
      ['missing medications array', { name: 'Plan B' }],
    ])(
      'omite prescription cuando el contenedor es %s y mantiene la validacion vigente',
      async (_label, prescription) => {
        const dto = await service[
          'mapCreateClinicHistoryArgsToDtoWithoutAppointment'
        ](
          {
            ...createBaseClinicHistoryArgs(),
            prescription,
          },
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
        );

        expect(dto.prescription).toBeUndefined();
        expect(dto.patientId).toBe('550e8400-e29b-41d4-a716-446655440001');
        expect(dto.specialtyId).toBe('550e8400-e29b-41d4-a716-446655440002');
      },
    );
  });
});
