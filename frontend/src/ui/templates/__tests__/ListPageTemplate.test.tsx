import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { ListPageTemplate } from '../ListPageTemplate';

describe('ListPageTemplate', () => {
  it('renderiza correctamente', () => {
    render(
      <ListPageTemplate title="Page Title">
        <div>Content</div>
      </ListPageTemplate>
    );
    expect(screen.getByText('Page Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('muestra descripcion cuando se proporciona', () => {
    render(
      <ListPageTemplate title="Title" description="Description">
        <div>Content</div>
      </ListPageTemplate>
    );
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('muestra acciones cuando se proporcionan', () => {
    render(
      <ListPageTemplate
        title="Title"
        actions={<button>Action</button>}
      >
        <div>Content</div>
      </ListPageTemplate>
    );
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
  });

  it('muestra filtros cuando se proporcionan', () => {
    render(
      <ListPageTemplate
        title="Title"
        filters={<input type="text" placeholder="Filter" />}
      >
        <div>Content</div>
      </ListPageTemplate>
    );
    expect(screen.getByPlaceholderText('Filter')).toBeInTheDocument();
  });

  it('aplica className personalizada', () => {
    const { container } = render(
      <ListPageTemplate title="Title" className="custom-class">
        <div>Content</div>
      </ListPageTemplate>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
