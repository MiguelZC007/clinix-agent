import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { FormSection } from '../FormSection';

describe('FormSection', () => {
  it('renderiza correctamente', () => {
    render(
      <FormSection title="Section Title">
        <div>Content</div>
      </FormSection>
    );
    expect(screen.getByText('Section Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('muestra descripcion cuando se proporciona', () => {
    render(
      <FormSection title="Title" description="Description">
        <div>Content</div>
      </FormSection>
    );
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renderiza children correctamente', () => {
    render(
      <FormSection title="Title">
        <input type="text" />
        <button>Submit</button>
      </FormSection>
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('aplica className personalizada', () => {
    const { container } = render(
      <FormSection title="Title" className="custom-class">
        <div>Content</div>
      </FormSection>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
