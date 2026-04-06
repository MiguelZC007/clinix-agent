import { describe, it, expect } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { BreadcrumbNav, type BreadcrumbItemData } from '../BreadcrumbNav';

describe('BreadcrumbNav', () => {
  const items: BreadcrumbItemData[] = [
    { label: 'Home', href: '/' },
    { label: 'Patients', href: '/patients' },
    { label: 'Details' },
  ];

  it('renderiza correctamente', () => {
    render(<BreadcrumbNav items={items} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Patients')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('renderiza items con links', () => {
    render(<BreadcrumbNav items={items} />);
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renderiza ultimo item sin link', () => {
    render(<BreadcrumbNav items={items} />);
    const details = screen.getByText('Details');
    expect(details.closest('a')).not.toBeInTheDocument();
  });

  it('maneja lista vacia', () => {
    render(<BreadcrumbNav items={[]} />);
    const breadcrumb = screen.getByRole('navigation');
    expect(breadcrumb).toBeInTheDocument();
  });

  it('maneja un solo item', () => {
    render(<BreadcrumbNav items={[{ label: 'Home' }]} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});
