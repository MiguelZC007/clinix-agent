'use client';

import { useSetAtom } from 'jotai';
import { apiLoadingAtom, navigationLoadingAtom, loadingMessageAtom } from '@/lib/store/loading.atoms';

export function useLoading() {
  const setApiLoading = useSetAtom(apiLoadingAtom);
  const setNavigationLoading = useSetAtom(navigationLoadingAtom);
  const setLoadingMessage = useSetAtom(loadingMessageAtom);

  const setApiLoadingState = (isLoading: boolean, message?: string | null) => {
    setApiLoading(isLoading);
    setLoadingMessage(message || null);
  };

  const setNavigationLoadingState = (isLoading: boolean, message?: string | null) => {
    setNavigationLoading(isLoading);
    setLoadingMessage(message || null);
  };

  const setLoading = (isLoading: boolean, message?: string | null) => {
    setApiLoading(isLoading);
    setNavigationLoading(isLoading);
    setLoadingMessage(message || null);
  };

  const clearLoading = () => {
    setApiLoading(false);
    setNavigationLoading(false);
    setLoadingMessage(null);
  };

  return {
    setApiLoading: setApiLoadingState,
    setNavigationLoading: setNavigationLoadingState,
    setLoading,
    clearLoading,
  };
}
