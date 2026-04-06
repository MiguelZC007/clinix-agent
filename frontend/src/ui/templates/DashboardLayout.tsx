'use client';

import { useEffect, useState } from 'react';
import type { BreadcrumbItemData } from '@/ui/molecules/BreadcrumbNav';
import { Header } from '@/ui/organisms/Header';
import { MobileSidebar } from '@/ui/organisms/MobileSidebar';
import { Sidebar } from '@/ui/organisms/Sidebar';

const SIDEBAR_STORAGE_KEY = 'clinix-sidebar-collapsed';

function parseStoredSidebarCollapsed(raw: string | null): boolean {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return false;
}

type DashboardLayoutProps = {
  children: React.ReactNode;
  breadcrumbs: BreadcrumbItemData[];
};

export function DashboardLayout({ children, breadcrumbs }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(SIDEBAR_STORAGE_KEY) : null;
      setSidebarCollapsed(parseStoredSidebarCollapsed(stored));
    } catch {
      setSidebarCollapsed(false);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      // ignore
    }
  }, [sidebarCollapsed]);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:block">
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          breadcrumbs={breadcrumbs}
          onMenuClick={() => setMobileOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed((prev) => !prev)}
        />

        <main className="flex-1 overflow-auto bg-background p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
