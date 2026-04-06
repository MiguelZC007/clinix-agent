import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import type { BreadcrumbItemData } from '@/ui/molecules/BreadcrumbNav';
import { DashboardLayout } from '../DashboardLayout';

vi.mock('@/lib/auth/hooks', () => ({
  useAuth: () => ({ logout: vi.fn() }),
}));

describe('DashboardLayout', () => {
  const breadcrumbs: BreadcrumbItemData[] = [
    { label: 'Home', href: '/' },
  ];

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      key: vi.fn(),
      clear: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renderiza correctamente', () => {
    render(
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('muestra sidebar en desktop', () => {
    render(
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Clínica San Miguel')).toBeInTheDocument();
  });

  it('muestra header con breadcrumbs', () => {
    render(
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <div>Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renderiza children en main', () => {
    render(
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <div>Main Content</div>
      </DashboardLayout>
    );
    expect(screen.getByText('Main Content')).toBeInTheDocument();
  });

  it('colapsa sidebar al hacer click en el botón de toggle', async () => {
    const user = userEvent.setup();
    render(
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <div>Content</div>
      </DashboardLayout>
    );
    const aside = screen.getByRole('complementary');
    expect(aside).toHaveClass('w-64');
    const toggleButton = screen.getByRole('button', {
      name: 'collapseSidebar',
    });
    await user.click(toggleButton);
    expect(aside).toHaveClass('w-16');
  });
});
