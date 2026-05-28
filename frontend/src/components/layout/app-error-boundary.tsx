import { Component, type ErrorInfo, type ReactElement, type ReactNode } from 'react';

import { ButtonLink } from '../ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('App error boundary:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-extrabold text-theme">Beklenmeyen bir sorun oluştu</h1>
          <p className="text-sm text-theme-muted">
            Sayfayı yenileyebilir veya keşif ekranına dönebilirsin. Sorun devam ederse destek ile iletişime geç.
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="tap-scale min-h-[48px] rounded-xl bg-primary font-bold text-white"
              onClick={() => window.location.reload()}
            >
              Sayfayı yenile
            </button>
            <ButtonLink to="/discover">Keşfe dön</ButtonLink>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
