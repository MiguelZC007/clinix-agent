import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { SearchInput } from '../SearchInput';

describe('SearchInput', () => {
  it('renderiza correctamente', () => {
    render(<SearchInput value="" onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('muestra valor inicial', () => {
    render(<SearchInput value="test" onChange={vi.fn()} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('test');
  });

  it('llama onChange al escribir', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');

    expect(onChange).toHaveBeenCalled();
  });

  it('muestra boton de limpiar cuando hay valor', () => {
    render(<SearchInput value="test" onChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('no muestra boton de limpiar cuando esta vacio', () => {
    render(<SearchInput value="" onChange={vi.fn()} />);
    const clearButton = screen.queryByRole('button');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('limpia valor al hacer click en boton', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="test" onChange={onChange} />);

    const buttons = screen.getAllByRole('button');
    const clearButton = buttons.find((btn) => btn.getAttribute('aria-label')?.includes('clear') || btn.querySelector('svg'));
    if (clearButton) {
      await user.click(clearButton);
      expect(onChange).toHaveBeenCalledWith('');
    }
  });

  it('aplica placeholder personalizado', () => {
    render(
      <SearchInput value="" onChange={vi.fn()} placeholder="Buscar..." />
    );
    const input = screen.getByPlaceholderText('Buscar...');
    expect(input).toBeInTheDocument();
  });
});
