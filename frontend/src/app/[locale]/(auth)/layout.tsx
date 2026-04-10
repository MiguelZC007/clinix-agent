'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
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

  // Si está autenticado, no mostrar el formulario de login (el useEffect redirigirá)
  if (status === 'authenticated') {
    return null;
  }

  return <AuthLayout>{children}</AuthLayout>;
}
