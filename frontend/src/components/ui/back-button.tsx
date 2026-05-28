import { ArrowLeft } from 'lucide-react';
import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

export function BackButton({
  to,
  label = 'Geri',
  className = '',
}: {
  to?: string;
  label?: string;
  className?: string;
}): ReactElement {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={`inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-primary hover:underline ${className}`}
      onClick={() => {
        if (to) navigate(to);
        else navigate(-1);
      }}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
