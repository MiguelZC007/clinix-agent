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
import type { ValidationError } from 'class-validator';

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
    expect(result.error?.code).toBe('SCHEMA_VALIDATION_FAILED');
    expect(result.error?.fields).toEqual(
      expect.arrayContaining(['symptoms', 'diagnostics', 'physicalExams']),
    );
  });

  it('retorna STRUCTURE_VALIDATION cuando hay violaciones estructurales anidadas del schema', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              ...validPayload,
              diagnostics: [{ name: 'Migraña' }],
            }),
          },
        },
      ],
    });

    const result = await service.structureAnamnesis(input);

    expect(result.ok).toBe(false);
    expect(result.error?.category).toBe('STRUCTURE_VALIDATION');
    expect(result.error?.code).toBe('SCHEMA_VALIDATION_FAILED');
    expect(result.error?.fields).toEqual(
      expect.arrayContaining(['diagnostics[0].description']),
    );
  });

  it('retorna SEMANTIC_VALIDATION con metadata de fields', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              ...validPayload,
              consultationReason: 'no informado',
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
      expect.arrayContaining(['consultationReason']),
    );
  });

  it('retorna SEMANTIC_VALIDATION con code, fields y details ante reglas semánticas fallidas', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              ...validPayload,
              consultationReason: 'no informado',
              treatment:
                'Manejo en guardia con control respiratorio y reevaluación clínica',
              diagnostics: [{ name: 'N/A', description: 'sin dato' }],
              symptoms: ['disnea', 'tos persistente'],
              vitalSigns: [
                { name: 'SpO2', value: '49', unit: '%', measurement: 'reposo' },
              ],
            }),
          },
        },
      ],
    });

    const result = await service.structureAnamnesis(input);

    expect(result.ok).toBe(false);
    expect(result.error?.category).toBe('SEMANTIC_VALIDATION');
    expect(result.error?.code).toBe('SEMANTIC_RULES_FAILED');
    expect(result.error?.fields).toEqual(
      expect.arrayContaining([
        'consultationReason',
        'diagnostics[0].name',
        'diagnostics',
        'vitalSigns[0].value',
      ]),
    );
    const details = result.error?.details ?? [];
    expect(
      details.some(
        (item) =>
          item.path === 'consultationReason' &&
          item.message.includes('contenido no informativo'),
      ),
    ).toBe(true);
    expect(
      details.some(
        (item) =>
          item.path === 'vitalSigns[0].value' && item.message.length > 0,
      ),
    ).toBe(true);
  });

  it('prioriza DTO_VALIDATION_FAILED antes de reglas semánticas cuando ambas fallarían', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              ...validPayload,
              consultationReason: 'no informado',
            }),
          },
        },
      ],
    });

    const result = await service.structureAnamnesis({
      ...input,
      mode: 'WITH_APPOINTMENT',
      appointmentId: 'no-es-uuid',
    });

    expect(result.ok).toBe(false);
    expect(result.error?.category).toBe('SEMANTIC_VALIDATION');
    expect(result.error?.code).toBe('DTO_VALIDATION_FAILED');
    expect(result.error?.fields).toEqual(
      expect.arrayContaining(['appointmentId']),
    );
    expect(result.error?.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'appointmentId',
          message: expect.stringContaining('UUID'),
        }),
      ]),
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

  it('rechaza variantes con separadores de no referido en cualquier string no permitido', async () => {
    mockChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              ...validPayload,
              diagnostics: [{ name: 'No-Referido', description: 'episodio agudo' }],
              symptoms: ['n / r'],
            }),
          },
        },
      ],
    });

    const result = await service.structureAnamnesis(input);

    expect(result.ok).toBe(false);
    expect(result.error?.category).toBe('SEMANTIC_VALIDATION');
    expect(result.error?.code).toBe('NO_REFERIDO_POLICY_VIOLATION');
    expect(result.error?.fields).toEqual(
      expect.arrayContaining(['diagnostics[0].name', 'symptoms[0]']),
    );
  });

  it('aplana errores anidados de class-validator con paths indexados completos', () => {
    const nestedErrors: ValidationError[] = [
      {
        property: 'diagnostics',
        children: [
          {
            property: '0',
            children: [
              {
                property: 'name',
                constraints: {
                  minLength: 'El nombre debe tener al menos 2 caracteres',
                },
              } as ValidationError,
            ],
          } as ValidationError,
        ],
      } as ValidationError,
    ];

    const result = (
      service as unknown as {
        semanticFailure: (errors: ValidationError[]) => {
          ok: boolean;
          error?: {
            code?: string;
            fields?: string[];
            details?: Array<{ path: string; message: string }>;
          };
        };
      }
    ).semanticFailure(nestedErrors);

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('DTO_VALIDATION_FAILED');
    expect(result.error?.fields).toEqual(['diagnostics[0].name']);
    expect(result.error?.details).toEqual([
      {
        path: 'diagnostics[0].name',
        message: 'El nombre debe tener al menos 2 caracteres',
      },
    ]);
  });
});
