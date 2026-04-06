'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import { LoadingSpinner } from '@/ui/atoms/LoadingSpinner';
import { AuthLayout } from '@/ui/templates/AuthLayout';

type AuthLayoutPageProps = {
  children: React.ReactNode;
};

export default function AuthLayoutPage({ children }: AuthLayoutPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Si ya está autenticado, redirigir a pacientes (respeta el locale)
    if (status === 'authenticated' && session) {
      router.replace('/patients');
    }
  }, [status, session, router]);

  // Mostrar loading mientras se verifica la sesión
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Si está autenticado, no mostrar el formulario de login (el useEffect redirigirá)
  if (status === 'authenticated') {
    return null;
  }

  return <AuthLayout>{children}</AuthLayout>;
}
