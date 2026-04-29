import { assertModelSupportsStructuredOutputs } from './model-capability.registry';

describe('model-capability.registry', () => {
  it('acepta modelos compatibles con structured outputs strict', () => {
    expect(() =>
      assertModelSupportsStructuredOutputs('gpt-4o-mini'),
    ).not.toThrow();
  });

  it('normaliza el identificador del modelo antes de validar', () => {
    expect(() =>
      assertModelSupportsStructuredOutputs('  GPT-4.1  '),
    ).not.toThrow();
  });

  it('falla con error accionable para modelos incompatibles', () => {
    expect(() => assertModelSupportsStructuredOutputs('gpt-3.5-turbo')).toThrow(
      'OPENAI_MODEL "gpt-3.5-turbo" no soporta structured outputs strict',
    );
  });
});
