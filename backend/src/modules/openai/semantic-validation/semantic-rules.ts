import type { SemanticViolation } from './semantic-validation.types';
import { isNoReferidoAllowedField } from '../anamnesis.schema';

type DiagnosticLike = { name?: unknown; description?: unknown };
type VitalSignLike = { name?: unknown; value?: unknown };

type SemanticPayload = {
  consultationReason?: unknown;
  treatment?: unknown;
  diagnostics?: unknown;
  symptoms?: unknown;
  vitalSigns?: unknown;
  physicalExams?: unknown;
  prescription?: unknown;
};

const PLACEHOLDERS = ['n/a', 'na', 'pendiente', 'no informado', 'sin dato'];
const RESPIRATORY_TERMS = [
  'disnea',
  'tos',
  'sibilancias',
  'esputo',
  'respiratorio',
];
const RESPIRATORY_DIAGNOSTIC_TERMS = [
  'asma',
  'bronquitis',
  'neumonia',
  'epoc',
  'infeccion respiratoria',
  'respiratoria',
];
const RESPIRATORY_TREATMENT_TERMS = [
  'broncodilatador',
  'inhal',
  'oxigen',
  'nebul',
  'antibiotico',
];
const OXYGEN_SATURATION_TERMS = [
  'oxygensaturation',
  'saturacion de oxigeno',
  'sat o2',
  'sao2',
  'spo2',
];
function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeAlphanumeric(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]/g, '');
}

function isPlaceholder(value: unknown): boolean {
  return (
    typeof value === 'string' && PLACEHOLDERS.includes(normalizeText(value))
  );
}

function toDiagnostics(input: unknown): DiagnosticLike[] {
  return Array.isArray(input) ? (input as DiagnosticLike[]) : [];
}

function toVitalSigns(input: unknown): VitalSignLike[] {
  return Array.isArray(input) ? (input as VitalSignLike[]) : [];
}

function containsAny(value: string, dictionary: string[]): boolean {
  return dictionary.some((term) => value.includes(term));
}

function getPrescriptionRespiratoryText(input: unknown): string {
  if (!input || typeof input !== 'object') {
    return '';
  }

  const prescription = input as Record<string, unknown>;
  const parts: string[] = [];

  if (typeof prescription.description === 'string') {
    parts.push(prescription.description);
  }

  if (Array.isArray(prescription.medications)) {
    prescription.medications.forEach((medication) => {
      if (!medication || typeof medication !== 'object') {
        return;
      }
      const med = medication as Record<string, unknown>;
      ['name', 'indications', 'description', 'administrationRoute'].forEach(
        (field) => {
          if (typeof med[field] === 'string') {
            parts.push(med[field]);
          }
        },
      );
    });
  }

  return normalizeText(parts.join(' '));
}

function parseNumericValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().replace(',', '.');
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function evaluateNonInformativeContent(
  payload: SemanticPayload,
): SemanticViolation[] {
  const violations: SemanticViolation[] = [];

  const visit = (
    value: unknown,
    currentPath: string,
    policyPath: string,
  ): void => {
    if (typeof value === 'string') {
      if (isPlaceholder(value) && !isNoReferidoAllowedField(policyPath)) {
        violations.push({
          code: 'NON_INFORMATIVE_CONTENT',
          path: currentPath,
          message: `El campo ${currentPath} contiene contenido no informativo.`,
        });
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        visit(item, `${currentPath}[${index}]`, policyPath);
      });
      return;
    }

    if (value && typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(
        ([key, nested]) => {
          const nextCurrentPath = currentPath ? `${currentPath}.${key}` : key;
          const nextPolicyPath = policyPath ? `${policyPath}.${key}` : key;
          visit(nested, nextCurrentPath, nextPolicyPath);
        },
      );
    }
  };

  const roots: Array<keyof SemanticPayload> = [
    'consultationReason',
    'treatment',
    'diagnostics',
    'symptoms',
    'vitalSigns',
    'physicalExams',
    'prescription',
  ];

  roots.forEach((root) => {
    if (payload[root] !== undefined) {
      visit(payload[root], root, root);
    }
  });

  return violations;
}

export function evaluateClinicalInconsistency(
  payload: SemanticPayload,
): SemanticViolation[] {
  const symptomsText = Array.isArray(payload.symptoms)
    ? normalizeText(
        payload.symptoms.filter((item) => typeof item === 'string').join(' '),
      )
    : '';

  const hasRespiratorySymptoms = containsAny(symptomsText, RESPIRATORY_TERMS);
  if (!hasRespiratorySymptoms) {
    return [];
  }

  const diagnosticsText = normalizeText(
    toDiagnostics(payload.diagnostics)
      .map((item) => {
        const name = typeof item?.name === 'string' ? item.name : '';
        const description =
          typeof item?.description === 'string' ? item.description : '';
        return `${name} ${description}`.trim();
      })
      .join(' '),
  );
  const treatmentText =
    typeof payload.treatment === 'string'
      ? normalizeText(payload.treatment)
      : '';
  const prescriptionText = getPrescriptionRespiratoryText(payload.prescription);

  const hasRespiratoryDiagnosis = containsAny(
    diagnosticsText,
    RESPIRATORY_DIAGNOSTIC_TERMS,
  );
  const hasRespiratoryTreatment = containsAny(
    `${treatmentText} ${prescriptionText}`,
    RESPIRATORY_TREATMENT_TERMS,
  );

  if (hasRespiratoryDiagnosis || hasRespiratoryTreatment) {
    return [];
  }

  return [
    {
      code: 'CLINICAL_INCONSISTENCY',
      path: 'diagnostics',
      message:
        'Los síntomas respiratorios no guardan coherencia mínima con diagnóstico/tratamiento.',
    },
  ];
}

export function evaluateVitalSignOutOfRange(
  payload: SemanticPayload,
): SemanticViolation[] {
  return toVitalSigns(payload.vitalSigns)
    .map((vitalSign, index) => ({ vitalSign, index }))
    .filter(({ vitalSign }) => typeof vitalSign.name === 'string')
    .filter(({ vitalSign }) => {
      const normalizedName = normalizeText(String(vitalSign.name));
      const compactName = normalizeAlphanumeric(normalizedName);
      const hasSaturationAlias = containsAny(
        compactName,
        OXYGEN_SATURATION_TERMS.map(normalizeAlphanumeric),
      );

      if (hasSaturationAlias) {
        return true;
      }

      return false;
    })
    .flatMap(({ vitalSign, index }) => {
      const value = parseNumericValue(vitalSign.value);
      if (value === null || value < 50 || value > 100) {
        return [
          {
            code: 'VITAL_SIGN_OUT_OF_RANGE' as const,
            path: `vitalSigns[${index}].value`,
            message: 'La saturación de oxígeno debe estar entre 50 y 100.',
          },
        ];
      }
      return [];
    });
}
