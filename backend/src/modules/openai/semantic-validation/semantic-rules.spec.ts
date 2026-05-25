import {
  evaluateClinicalInconsistency,
  evaluateNonInformativeContent,
  evaluateVitalSignOutOfRange,
} from './semantic-rules';

describe('semantic-rules', () => {
  describe('evaluateNonInformativeContent', () => {
    it('marca placeholders en diagnóstico y campos críticos', () => {
      const violations = evaluateNonInformativeContent({
        consultationReason: 'Disnea progresiva de 3 días',
        treatment: 'pendiente',
        diagnostics: [{ name: 'N/A', description: 'sin dato' }],
      });

      expect(violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'NON_INFORMATIVE_CONTENT',
            path: 'treatment',
          }),
          expect.objectContaining({
            code: 'NON_INFORMATIVE_CONTENT',
            path: 'diagnostics[0].name',
          }),
        ]),
      );
    });

    it('normaliza case y espacios para placeholders', () => {
      const violations = evaluateNonInformativeContent({
        consultationReason: 'No informado',
      });

      expect(violations).toEqual([
        expect.objectContaining({
          code: 'NON_INFORMATIVE_CONTENT',
          path: 'consultationReason',
        }),
      ]);
    });

    it('valida contenido no informativo en otros campos textuales relevantes', () => {
      const violations = evaluateNonInformativeContent({
        consultationReason: 'Dolor abdominal',
        treatment: 'control y analgesia',
        symptoms: ['NA'],
        diagnostics: [{ name: 'sin dato', description: 'normal' }],
        physicalExams: [{ name: 'pendiente', description: 'abdomen blando' }],
        vitalSigns: [
          {
            name: 'SpO2',
            value: '98',
            unit: 'n/a',
            measurement: 'reposo',
          },
        ],
      });

      expect(violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'symptoms[0]' }),
          expect.objectContaining({ path: 'diagnostics[0].name' }),
          expect.objectContaining({ path: 'physicalExams[0].name' }),
          expect.objectContaining({ path: 'vitalSigns[0].unit' }),
        ]),
      );
    });

    it('respeta excepciones de policy para campos permitidos', () => {
      const violations = evaluateNonInformativeContent({
        consultationReason: 'Dolor torácico de inicio súbito',
        treatment: 'Plan de control clínico y seguimiento',
        diagnostics: [{ name: 'Angina', description: 'no informado' }],
      });

      expect(
        violations.some(
          (violation) => violation.path === 'diagnostics[0].description',
        ),
      ).toBe(false);
    });
  });

  describe('evaluateClinicalInconsistency', () => {
    it('detecta incoherencia síntomas respiratorios vs diagnóstico/tratamiento no relacionado', () => {
      const violations = evaluateClinicalInconsistency({
        symptoms: ['disnea', 'tos persistente'],
        diagnostics: [{ name: 'Dermatitis de contacto', description: '' }],
        treatment: 'Crema tópica en zona afectada cada 8 horas',
      });

      expect(violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'CLINICAL_INCONSISTENCY' }),
        ]),
      );
    });

    it('no marca inconsistencia cuando diagnóstico/tratamiento son respiratorios', () => {
      const violations = evaluateClinicalInconsistency({
        symptoms: ['disnea', 'tos con expectoración'],
        diagnostics: [{ name: 'Bronquitis aguda', description: '' }],
        treatment: 'Broncodilatador inhalado y control clínico en 48h',
      });

      expect(violations).toHaveLength(0);
    });

    it('no marca inconsistencia cuando la conducta respiratoria viene en prescription', () => {
      const violations = evaluateClinicalInconsistency({
        symptoms: ['disnea', 'tos persistente'],
        diagnostics: [{ name: 'Dolor lumbar', description: '' }],
        treatment: 'Control clínico general',
        prescription: {
          name: 'Receta ambulatoria',
          description: 'Nebulizaciones y seguimiento respiratorio',
          medications: [
            {
              name: 'Salbutamol inhalador',
              quantity: 1,
              unit: 'frasco',
              frequency: 'cada 8 horas',
              duration: '5 días',
              indications: 'Disnea y sibilancias',
              administrationRoute: 'inhalatoria',
              description: 'Broncodilatador de rescate',
            },
          ],
        },
      });

      expect(violations).toHaveLength(0);
    });

    it('no marca inconsistencia cuando el detalle respiratorio viene en diagnostics.description', () => {
      const violations = evaluateClinicalInconsistency({
        symptoms: ['disnea de esfuerzo'],
        diagnostics: [
          {
            name: 'Infección',
            description: 'Compromiso respiratorio alto con bronquitis aguda',
          },
        ],
        treatment: 'Control clínico y reposo',
      });

      expect(violations).toHaveLength(0);
    });
  });

  describe('evaluateVitalSignOutOfRange', () => {
    it('valida borde inferior y superior de oxigenación', () => {
      const violations = evaluateVitalSignOutOfRange({
        vitalSigns: [
          { name: 'oxygenSaturation', value: '49' },
          { name: 'oxígeno', value: '50' },
          { name: 'saturación de oxígeno', value: '100' },
          { name: 'SpO2', value: '101' },
        ],
      });

      expect(violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'vitalSigns[0].value' }),
          expect.objectContaining({ path: 'vitalSigns[3].value' }),
        ]),
      );
      expect(violations).toHaveLength(2);
    });

    it('permite omisión de signos vitales', () => {
      const violations = evaluateVitalSignOutOfRange({});

      expect(violations).toHaveLength(0);
    });

    it('acepta formatos comunes de saturación con símbolo de porcentaje', () => {
      const violations = evaluateVitalSignOutOfRange({
        vitalSigns: [
          { name: 'SpO2', value: '98%' },
          { name: 'saturación de oxígeno', value: '95 %' },
        ],
      });

      expect(violations).toHaveLength(0);
    });

    it('no toma oxígeno suplementario/flujo como saturación de oxígeno', () => {
      const violations = evaluateVitalSignOutOfRange({
        vitalSigns: [
          { name: 'Oxígeno por cánula nasal', value: '2' },
          { name: 'Flujo de oxígeno', value: '15' },
          { name: 'SpO2', value: '48' },
        ],
      });

      expect(violations).toEqual([
        expect.objectContaining({ path: 'vitalSigns[2].value' }),
      ]);
    });

    it('valida alias con puntuación y no los excluye por contexto de cánula/máscara', () => {
      const violations = evaluateVitalSignOutOfRange({
        vitalSigns: [
          { name: 'Sat. O2 con cánula nasal', value: '49' },
          { name: 'SpO2 con máscara simple', value: '101' },
        ],
      });

      expect(violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: 'vitalSigns[0].value' }),
          expect.objectContaining({ path: 'vitalSigns[1].value' }),
        ]),
      );
      expect(violations).toHaveLength(2);
    });
  });
});
