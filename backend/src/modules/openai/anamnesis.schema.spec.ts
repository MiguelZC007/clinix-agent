import {
  ANAMNESIS_SCHEMA,
  ANAMNESIS_SCHEMA_ID,
  ANAMNESIS_SCHEMA_VERSION,
  isNoReferidoAllowedField,
} from './anamnesis.schema';

describe('anamnesis.schema', () => {
  it('expone metadatos de versión estables', () => {
    expect(ANAMNESIS_SCHEMA_VERSION).toBe('v1');
    expect(ANAMNESIS_SCHEMA_ID).toContain('anamnesis-structuring');
  });

  it('mantiene paridad mínima de campos requeridos con DTO de clinic history', () => {
    expect(ANAMNESIS_SCHEMA.required).toEqual(
      expect.arrayContaining([
        'consultationReason',
        'symptoms',
        'treatment',
        'diagnostics',
        'physicalExams',
        'vitalSigns',
      ]),
    );
  });

  it('declara constraints de arreglos críticos', () => {
    const symptoms = ANAMNESIS_SCHEMA.properties.symptoms;
    const diagnostics = ANAMNESIS_SCHEMA.properties.diagnostics;

    expect(symptoms.type).toBe('array');
    expect(symptoms.minItems).toBe(1);
    expect(symptoms.maxItems).toBe(50);
    expect(diagnostics.maxItems).toBe(20);
  });

  it('permite no referido solo en campos policy-allowed', () => {
    expect(isNoReferidoAllowedField('consultationReason')).toBe(false);
    expect(isNoReferidoAllowedField('treatment')).toBe(false);
    expect(isNoReferidoAllowedField('prescription.description')).toBe(true);
  });
});
