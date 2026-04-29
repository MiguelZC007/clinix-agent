import { openaiTools } from './tool-definitions.service';

function hasFunctionContract(item: unknown): item is {
  function: {
    name: string;
    parameters: {
      type: string;
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
} {
  if (typeof item !== 'object' || item === null || !('function' in item)) {
    return false;
  }

  const maybeFunction = (item as { function?: unknown }).function;
  return (
    typeof maybeFunction === 'object' &&
    maybeFunction !== null &&
    'name' in maybeFunction &&
    'parameters' in maybeFunction
  );
}

describe('tool-definitions.service', () => {
  it('incluye la tool structure_anamnesis con contrato serializable', () => {
    const tool = openaiTools.find(
      (item) =>
        hasFunctionContract(item) &&
        item.function.name === 'structure_anamnesis',
    );

    expect(tool).toBeDefined();
    if (!tool || !hasFunctionContract(tool)) {
      throw new Error('Tool structure_anamnesis no encontrada');
    }

    const parameters = tool.function.parameters;
    expect(parameters.type).toBe('object');

    const textProperty = parameters.properties.text;
    expect(textProperty).toEqual(expect.objectContaining({ type: 'string' }));

    const modeProperty = parameters.properties.mode;
    expect(modeProperty).toEqual(
      expect.objectContaining({
        type: 'string',
        enum: ['WITH_APPOINTMENT', 'WITHOUT_APPOINTMENT'],
      }),
    );

    expect(parameters.required).toEqual(
      expect.arrayContaining(['text', 'mode']),
    );
  });
});
