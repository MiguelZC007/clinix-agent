export type SemanticRuleCode =
  | 'NON_INFORMATIVE_CONTENT'
  | 'CLINICAL_INCONSISTENCY'
  | 'VITAL_SIGN_OUT_OF_RANGE';

export interface SemanticViolation {
  code: SemanticRuleCode;
  path: string;
  message: string;
}
