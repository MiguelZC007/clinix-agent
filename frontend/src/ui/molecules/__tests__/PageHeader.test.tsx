import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  it('renderiza correctamente', () => {
    render(<PageHeader title="Page Title" />);
    expect(screen.getByText('Page Title')).toBeInTheDocument();
  });

  it('muestra descripcion cuando se proporciona', () => {
    render(
      <PageHeader
        title="Page Title"
        description="Page description"
      />
    );
    expect(screen.getByText('Page description')).toBeInTheDocument();
  });

  it('muestra descripcion como ReactNode', () => {
    render(
      <PageHeader
        title="Page Title"
        description={<span>Custom description</span>}
      />
    );
    expect(screen.getByText('Custom description')).toBeInTheDocument();
  });

  it('muestra acciones cuando se proporcionan', () => {
    render(
      <PageHeader
        title="Page Title"
        actions={<button>Action</button>}
      />
    );
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
  });

  it('aplica className personalizada', () => {
    const { container } = render(
      <PageHeader title="Title" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
