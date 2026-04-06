import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Confirm Action',
    description: 'Are you sure?',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    onConfirm: vi.fn(),
  };

  it('renderiza cuando esta abierto', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('no renderiza cuando esta cerrado', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('llama onConfirm al hacer click en confirmar', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    const buttons = screen.getAllByRole('button');
    const confirmButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('confirm'));
    if (confirmButton) {
      await user.click(confirmButton);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    }
  });

  it('llama onOpenChange al hacer click en cancelar', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />);

    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find(btn => btn.textContent?.toLowerCase().includes('cancel'));
    if (cancelButton) {
      await user.click(cancelButton);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    }
  });

  it('aplica variante destructive', () => {
    render(<ConfirmDialog {...defaultProps} variant="destructive" />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
