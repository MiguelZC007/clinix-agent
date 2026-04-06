import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { getLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { authOptions } from '@/lib/auth/config';

export default async function NotFound() {
  let locale: string;
  try {
    locale = await getLocale();
  } catch {
    locale = routing.defaultLocale;
  }

  const session = await getServerSession(authOptions);

  const normalizedLocale = routing.locales.includes(locale as 'es' | 'en')
    ? (locale as 'es' | 'en')
    : routing.defaultLocale;

  const target = session ? '/dashboard' : '/login';
  redirect(`/${normalizedLocale}${target}`);
}
