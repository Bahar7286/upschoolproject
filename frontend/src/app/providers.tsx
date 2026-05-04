import { QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren, ReactElement } from 'react';
import { useState } from 'react';

import { ThemeSync } from '../components/theme/theme-sync';
import { createAppQueryClient } from '../lib/query-client';

export function AppProviders({ children }: PropsWithChildren): ReactElement {
  const [queryClient] = useState(() => createAppQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      {children}
    </QueryClientProvider>
  );
}
