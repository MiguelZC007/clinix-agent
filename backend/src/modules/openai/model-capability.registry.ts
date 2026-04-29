const STRUCTURED_OUTPUTS_COMPATIBLE_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4.1',
  'gpt-4.1-mini',
] as const;

function normalizeModel(model: string): string {
  return model.trim().toLowerCase();
}

export function listStructuredOutputsCompatibleModels(): readonly string[] {
  return STRUCTURED_OUTPUTS_COMPATIBLE_MODELS;
}

export function assertModelSupportsStructuredOutputs(model: string): void {
  const normalized = normalizeModel(model);
  if (STRUCTURED_OUTPUTS_COMPATIBLE_MODELS.includes(normalized as never)) {
    return;
  }

  throw new Error(
    `OPENAI_MODEL "${model}" no soporta structured outputs strict. Modelos permitidos: ${STRUCTURED_OUTPUTS_COMPATIBLE_MODELS.join(', ')}`,
  );
}
