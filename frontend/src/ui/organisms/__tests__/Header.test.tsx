import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import type { BreadcrumbItemData } from '@/ui/molecules/BreadcrumbNav';
import { Header } from '../Header';

describe('Header', () => {
  const breadcrumbs: BreadcrumbItemData[] = [
    { label: 'Home', href: '/' },
    { label: 'Patients' },
  ];

  it('renderiza correctamente', () => {
    render(<Header breadcrumbs={breadcrumbs} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('muestra breadcrumbs', () => {
    render(<Header breadcrumbs={breadcrumbs} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Patients')).toBeInTheDocument();
  });

  it('muestra boton de menu en mobile', () => {
    render(<Header breadcrumbs={breadcrumbs} onMenuClick={vi.fn()} />);
    const menuButton = screen.getByRole('button');
    expect(menuButton).toBeInTheDocument();
  });

  it('llama onMenuClick al hacer click en menu', async () => {
    const user = userEvent.setup();
    const onMenuClick = vi.fn();
    render(<Header breadcrumbs={breadcrumbs} onMenuClick={onMenuClick} />);

    const menuButton = screen.getByRole('button');
    await user.click(menuButton);

    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('aplica className personalizada', () => {
    const { container } = render(
      <Header breadcrumbs={breadcrumbs} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('muestra botón de toggle de sidebar cuando onSidebarToggle está definido', () => {
    render(
      <Header
        breadcrumbs={breadcrumbs}
        onSidebarToggle={vi.fn()}
      />
    );
    const toggleButton = screen.getByRole('button', {
      name: 'collapseSidebar',
    });
    expect(toggleButton).toBeInTheDocument();
  });

  it('tiene aria-expanded false cuando sidebar está colapsado', () => {
    render(
      <Header
        breadcrumbs={breadcrumbs}
        sidebarCollapsed={true}
        onSidebarToggle={vi.fn()}
      />
    );
    const toggleButton = screen.getByRole('button', {
      name: 'expandSidebar',
    });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('llama onSidebarToggle al hacer click en el botón de toggle', async () => {
    const user = userEvent.setup();
    const onSidebarToggle = vi.fn();
    render(
      <Header
        breadcrumbs={breadcrumbs}
        onSidebarToggle={onSidebarToggle}
      />
    );
    const toggleButton = screen.getByRole('button', {
      name: 'collapseSidebar',
    });
    await user.click(toggleButton);
    expect(onSidebarToggle).toHaveBeenCalledTimes(1);
  });
});
