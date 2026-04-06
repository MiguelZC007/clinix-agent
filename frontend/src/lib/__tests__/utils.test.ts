import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('combina clases correctamente', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('maneja clases condicionales', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    expect(cn('foo', true && 'bar')).toBe('foo bar');
  });

  it('maneja objetos condicionales', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
    expect(cn({ foo: true, bar: true })).toBe('foo bar');
  });

  it('maneja arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('maneja valores undefined y null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('combina tailwind classes correctamente', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('maneja casos complejos', () => {
    expect(
      cn('base-class', { 'conditional-class': true }, ['array-class'], 'final-class')
    ).toContain('base-class');
    expect(
      cn('base-class', { 'conditional-class': true }, ['array-class'], 'final-class')
    ).toContain('final-class');
  });
});
