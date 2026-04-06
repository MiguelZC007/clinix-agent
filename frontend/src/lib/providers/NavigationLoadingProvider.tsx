'use client';

import { useNavigationLoading } from '@/lib/hooks/useNavigationLoading';

type NavigationLoadingProviderProps = {
  children: React.ReactNode;
};

export function NavigationLoadingProvider({ children }: NavigationLoadingProviderProps) {
  useNavigationLoading();
  return <>{children}</>;
}
