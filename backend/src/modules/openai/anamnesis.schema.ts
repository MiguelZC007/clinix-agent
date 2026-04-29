export const ANAMNESIS_SCHEMA_VERSION = 'v1';
export const ANAMNESIS_SCHEMA_ID =
  'clinix.anamnesis-structuring.create-clinic-history.v1';

const NO_REFERIDO_ALLOWED_FIELDS = new Set<string>([
  'diagnostics.description',
  'physicalExams.description',
  'vitalSigns.description',
  'prescription.description',
  'prescription.medications.description',
]);

export function isNoReferidoAllowedField(fieldPath: string): boolean {
  return NO_REFERIDO_ALLOWED_FIELDS.has(fieldPath);
}

export const ANAMNESIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'consultationReason',
    'symptoms',
    'treatment',
    'diagnostics',
    'physicalExams',
    'vitalSigns',
  ],
  properties: {
    appointmentId: { type: 'string' },
    patientId: { type: 'string' },
    specialtyId: { type: 'string' },
    patientNumber: { type: 'integer' },
    specialtyCode: { type: 'integer' },
    consultationReason: { type: 'string', minLength: 10, maxLength: 1000 },
    symptoms: {
      type: 'array',
      minItems: 1,
      maxItems: 50,
      items: { type: 'string' },
    },
    treatment: { type: 'string', minLength: 10, maxLength: 2000 },
    diagnostics: {
      type: 'array',
      maxItems: 20,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
    physicalExams: {
      type: 'array',
      maxItems: 30,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
    vitalSigns: {
      type: 'array',
      maxItems: 20,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'value', 'unit', 'measurement'],
        properties: {
          name: { type: 'string' },
          value: { type: 'string' },
          unit: { type: 'string' },
          measurement: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
    prescription: {
      type: 'object',
      additionalProperties: false,
      required: ['name', 'description', 'medications'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        medications: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: [
              'name',
              'quantity',
              'unit',
              'frequency',
              'duration',
              'indications',
              'administrationRoute',
            ],
            properties: {
              name: { type: 'string' },
              quantity: { type: 'number' },
              unit: { type: 'string' },
              frequency: { type: 'string' },
              duration: { type: 'string' },
              indications: { type: 'string' },
              administrationRoute: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
      },
    },
  },
} as const;
