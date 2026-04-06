'use client';

import { useEffect, useRef } from 'react';
import { useSetAtom } from 'jotai';
import { usePathname } from '@/i18n/navigation';
import { navigationLoadingAtom } from '@/lib/store/loading.atoms';

export function useNavigationLoading() {
  const pathname = usePathname();
  const setNavigationLoading = useSetAtom(navigationLoadingAtom);
  const previousPathname = useRef<string>(pathname);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Si el pathname cambió, activar loading
    if (previousPathname.current !== pathname) {
      setNavigationLoading(true);
      previousPathname.current = pathname;

      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Desactivar loading después de un delay mínimo para evitar parpadeos
      // El delay permite que la nueva página comience a cargar
      timeoutRef.current = setTimeout(() => {
        setNavigationLoading(false);
      }, 300);
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, setNavigationLoading]);
}
