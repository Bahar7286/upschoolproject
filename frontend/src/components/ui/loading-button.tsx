import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';

import { Button } from './button';

export function LoadingButton({
  loading = false,
  loadingLabel,
  children,
  type = 'button',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}): ReactElement {
  const label = loading ? (loadingLabel ?? 'Yükleniyor…') : children;
  return (
    <Button
      type={type}
      className={className}
      disabled={loading || props.disabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" /> : null}
      {label}
    </Button>
  );
}
