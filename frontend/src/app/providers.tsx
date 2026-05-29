import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren, ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';

import { AppErrorBoundary } from '../components/layout/app-error-boundary';
import { ThemeSync } from '../components/theme/theme-sync';
import { I18nProvider } from '../lib/i18n';
import { wakeUpApi } from '../lib/api';
import { createAppQueryClient } from '../lib/query-client';

export function AppProviders({ children }: PropsWithChildren): ReactElement {
  const [queryClient] = useState(() => createAppQueryClient());

  useEffect(() => {
    void wakeUpApi(60_000);
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AppErrorBoundary>
          <I18nProvider>
            <ThemeSync />
            {children}
          </I18nProvider>
        </AppErrorBoundary>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
