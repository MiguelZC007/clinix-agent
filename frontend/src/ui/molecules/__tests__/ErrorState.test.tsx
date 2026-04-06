import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  it('renderiza correctamente', () => {
    render(
      <ErrorState
        title="Error occurred"
        description="Something went wrong"
      />
    );
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('muestra boton de retry cuando se proporciona', () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="Error"
        description="Description"
        retryLabel="Retry"
        onRetry={onRetry}
      />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('llama onRetry al hacer click', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="Error"
        description="Description"
        retryLabel="Retry"
        onRetry={onRetry}
      />
    );

    const retryButton = screen.getByRole('button');
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('no muestra boton cuando no hay onRetry', () => {
    render(
      <ErrorState
        title="Error"
        description="Description"
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('aplica className personalizada', () => {
    const { container } = render(
      <ErrorState
        title="Error"
        description="Description"
        className="custom-class"
      />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
