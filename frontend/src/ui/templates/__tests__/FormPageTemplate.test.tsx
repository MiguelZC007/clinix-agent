import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { FormPageTemplate } from '../FormPageTemplate';

describe('FormPageTemplate', () => {
  it('renderiza correctamente', () => {
    render(
      <FormPageTemplate title="Form Title">
        <form>Form Content</form>
      </FormPageTemplate>
    );
    expect(screen.getByText('Form Title')).toBeInTheDocument();
    expect(screen.getByText('Form Content')).toBeInTheDocument();
  });

  it('muestra descripcion cuando se proporciona', () => {
    render(
      <FormPageTemplate title="Title" description="Description">
        <form>Content</form>
      </FormPageTemplate>
    );
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('muestra acciones cuando se proporcionan', () => {
    render(
      <FormPageTemplate
        title="Title"
        actions={<button>Action</button>}
      >
        <form>Content</form>
      </FormPageTemplate>
    );
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
  });

  it('renderiza children en card', () => {
    render(
      <FormPageTemplate title="Title">
        <input type="text" />
      </FormPageTemplate>
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('aplica className personalizada', () => {
    const { container } = render(
      <FormPageTemplate title="Title" className="custom-class">
        <form>Content</form>
      </FormPageTemplate>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
