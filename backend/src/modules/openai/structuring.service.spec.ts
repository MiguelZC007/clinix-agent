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
    OPENAI_MODEL: 'gpt-4o-mini',
  },
}));

import { StructuringService } from './structuring.service';
import type { StructureAnamnesisInput } from './structuring.types';

describe('StructuringService', () => {
  let service: StructuringService;

  const input: StructureAnamnesisInput = {
    text: 'Paciente con dolor de cabeza y náuseas',
    mode: 'WITHOUT_APPOINTMENT',
    patientRef: { patientNumber: 1 },
    specialtyRef: { specialtyCode: 10 },
  };

  const validPayload = {
    consultationReason: 'Dolor de cabeza persistente hace 10 días',
    symptoms: ['cefalea'],
    treatment: 'Hidratación, reposo y control en 48 horas',
    diagnostics: [{ name: 'Migraña', description: 'episodio agudo' }],
    physicalExams: [{ name: 'Neurológico', description: 'sin focalidad' }],
    vitalSigns: [
      {
        name: 'TA',
        value: '120/80',
        unit: 'mmHg',
        measurement: 'sentado',
      },
    ],
  };

  beforeEach(() => {
    mockChatCompletionsCreate.mockReset();
    service = new StructuringService();
  });

  it('devuelve ok=true para payload estructural y semánticamente válido', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(validPayload),
          },
        },
      ],
    });

    const result = await service.structureAnamnesis(input);

    expect(result.ok).toBe(true);
    expect(result.data).toEqual(
      expect.objectContaining({
        consultationReason: validPayload.consultationReason,
        symptoms: validPayload.symptoms,
        treatment: validPayload.treatment,
      }),
    );
  });

  it('inyecta appointmentId en modo WITH_APPOINTMENT para cumplir DTO destino', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validPayload) } }],
    });

    const result = await service.structureAnamnesis({
      ...input,
      mode: 'WITH_APPOINTMENT',
      appointmentId: '550e8400-e29b-41d4-a716-446655440003',
    });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual(
      expect.objectContaining({
        appointmentId: '550e8400-e29b-41d4-a716-446655440003',
      }),
    );
  });

  it('retorna MODEL_CAPABILITY si el modelo es incompatible', async () => {
    service = new StructuringService('gpt-3.5-turbo');

    const result = await service.structureAnamnesis(input);

    expect(result.ok).toBe(false);
    expect(result.error?.category).toBe('MODEL_CAPABILITY');
  });

  it('retorna STRUCTURE_VALIDATION cuando el payload no es JSON parseable', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [{ message: { content: 'not-json' } }],
    });

    const result = await service.structureAnamnesis(input);

    expect(result.ok).toBe(false);
    expect(result.error?.category).toBe('STRUCTURE_VALIDATION');
  });

  it('retorna STRUCTURE_VALIDATION cuando faltan campos requeridos del schema', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              consultationReason: validPayload.consultationReason,
              treatment: validPayload.treatment,
            }),
          },
        },
      ],
    });

    const result = await service.structureAnamnesis(input);

    expect(result.ok).toBe(false);
    expect(result.error?.category).toBe('STRUCTURE_VALIDATION');
    expect(result.error?.code).toBe('SCHEMA_REQUIRED_FIELDS_MISSING');
    expect(result.error?.fields).toEqual(
      expect.arrayContaining(['symptoms', 'diagnostics', 'physicalExams']),
    );
  });

  it('retorna SEMANTIC_VALIDATION con metadata de fields', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              consultationReason: 'corto',
              symptoms: [],
              treatment: 'corto',
              diagnostics: [],
              physicalExams: [],
              vitalSigns: [],
            }),
          },
        },
      ],
    });

    const result = await service.structureAnamnesis(input);

    expect(result.ok).toBe(false);
    expect(result.error?.category).toBe('SEMANTIC_VALIDATION');
    expect(result.error?.fields).toEqual(
      expect.arrayContaining(['consultationReason', 'symptoms', 'treatment']),
    );
  });

  it('retorna PROVIDER_RUNTIME ante errores del proveedor OpenAI', async () => {
    mockChatCompletionsCreate.mockRejectedValue(new Error('timeout'));

    const result = await service.structureAnamnesis(input);

    expect(result.ok).toBe(false);
    expect(result.error?.category).toBe('PROVIDER_RUNTIME');
  });

  it('rechaza no referido en campos obligatorios no permitidos por policy', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              ...validPayload,
              consultationReason: 'no referido',
            }),
          },
        },
      ],
    });

    const result = await service.structureAnamnesis(input);

    expect(result.ok).toBe(false);
    expect(result.error?.category).toBe('SEMANTIC_VALIDATION');
    expect(result.error?.code).toBe('NO_REFERIDO_POLICY_VIOLATION');
    expect(result.error?.fields).toEqual(['consultationReason']);
  });
});
