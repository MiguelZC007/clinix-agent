import {
  evaluateClinicalInconsistency,
  evaluateNonInformativeContent,
  evaluateVitalSignOutOfRange,
} from './semantic-rules';
import type { SemanticViolation } from './semantic-validation.types';

export class AnamnesisSemanticValidator {
  validate(payload: Record<string, unknown>): SemanticViolation[] {
    return [
      ...evaluateNonInformativeContent(payload),
      ...evaluateClinicalInconsistency(payload),
      ...evaluateVitalSignOutOfRange(payload),
    ];
  }
}
