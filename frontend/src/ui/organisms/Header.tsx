'use client';

import { Menu, PanelLeft, PanelLeftClose } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BreadcrumbNav, type BreadcrumbItemData } from '@/ui/molecules/BreadcrumbNav';

type HeaderProps = {
  breadcrumbs: BreadcrumbItemData[];
  onMenuClick?: () => void;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
  className?: string;
};

export function Header({
  breadcrumbs,
  onMenuClick,
  sidebarCollapsed = false,
  onSidebarToggle,
  className,
}: HeaderProps) {
  const t = useTranslations('navigation');

  return (
    <header
      className={cn(
        'flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-6',
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label={t('openMenu')}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {onSidebarToggle && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex"
          onClick={onSidebarToggle}
          aria-expanded={!sidebarCollapsed}
          aria-label={sidebarCollapsed ? t('expandSidebar') : t('collapseSidebar')}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
      )}

      <BreadcrumbNav items={breadcrumbs} />
    </header>
  );
}
