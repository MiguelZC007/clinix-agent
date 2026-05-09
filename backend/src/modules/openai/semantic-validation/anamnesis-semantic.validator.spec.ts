import { AnamnesisSemanticValidator } from './anamnesis-semantic.validator';

describe('AnamnesisSemanticValidator', () => {
  it('agrega múltiples violaciones en orden estable', () => {
    const validator = new AnamnesisSemanticValidator();

    const violations = validator.validate({
      consultationReason: 'no informado',
      symptoms: ['disnea'],
      treatment: 'pendiente',
      diagnostics: [{ name: 'N/A', description: 'sin datos' }],
      vitalSigns: [{ name: 'SpO2', value: '49' }],
    });

    expect(violations.map((item) => item.code)).toEqual([
      'NON_INFORMATIVE_CONTENT',
      'NON_INFORMATIVE_CONTENT',
      'NON_INFORMATIVE_CONTENT',
      'CLINICAL_INCONSISTENCY',
      'VITAL_SIGN_OUT_OF_RANGE',
    ]);
    expect(violations[0]).toEqual(
      expect.objectContaining({ path: 'consultationReason' }),
    );
  });
});
