import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export type FormEnvioModalTone = 'success' | 'warning' | 'danger';

type Props = {
  open: boolean;
  tone: FormEnvioModalTone;
  title: string;
  message: string;
  onClose: () => void;
};

const toneStyles: Record<FormEnvioModalTone, { border: string; title: string }> = {
  success: {
    border: 'border-emerald-200 ring-emerald-100',
    title: 'text-emerald-900',
  },
  warning: {
    border: 'border-amber-200 ring-amber-100',
    title: 'text-amber-950',
  },
  danger: {
    border: 'border-rose-200 ring-rose-100',
    title: 'text-rose-950',
  },
};

export const FormEnvioResultModal = ({ open, tone, title, message, onClose }: Props) => {
  useEffect(() => {
    if (!open) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const s = toneStyles[tone];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[1px]"
        aria-label="Cerrar diálogo"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-envio-modal-title"
        className={`relative w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl ring-2 ${s.border}`}
      >
        <h2 id="form-envio-modal-title" className={`text-lg font-semibold ${s.title}`}>
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{message}</p>
        <Button
          type="button"
          onClick={onClose}
          className="mt-6 w-full bg-teal-700 text-white hover:bg-teal-800"
        >
          Entendido
        </Button>
      </div>
    </div>
  );
};
