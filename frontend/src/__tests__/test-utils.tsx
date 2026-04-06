import { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import esMessages from '@/messages/es.json';

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider messages={esMessages} locale="es">
      {children}
    </NextIntlClientProvider>
  );
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
