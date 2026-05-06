import { useEffect, useState } from "react";

import { usePwaRegister } from "@/hooks/usePwaRegister";

const UPDATE_PROMPT_SUPPRESS_KEY = "nosignal:pwa:update-clicked-at";
const UPDATE_PROMPT_SUPPRESS_MS = 3 * 60 * 1000;

const shouldStartSuppressed = (): boolean => {
  try {
    const raw = window.sessionStorage.getItem(UPDATE_PROMPT_SUPPRESS_KEY);
    const ts = raw ? Number(raw) : NaN;
    if (!Number.isFinite(ts)) {
      return false;
    }
    return Date.now() - ts < UPDATE_PROMPT_SUPPRESS_MS;
  } catch {
    return false;
  }
};

export const ReloadPrompt = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = usePwaRegister();
  const [isUpdating, setIsUpdating] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(() =>
    shouldStartSuppressed(),
  );

  useEffect(() => {
    if (!needRefresh) {
      setIsUpdating(false);
      setPromptDismissed(false);
      try {
        window.sessionStorage.removeItem(UPDATE_PROMPT_SUPPRESS_KEY);
      } catch {
        // ignore
      }
    }
  }, [needRefresh]);

  const handleReload = async () => {
    setPromptDismissed(true);
    setIsUpdating(true);
    try {
      window.sessionStorage.setItem(
        UPDATE_PROMPT_SUPPRESS_KEY,
        String(Date.now()),
      );
    } catch {
      // ignore
    }
    try {
      await updateServiceWorker(true);
    } catch {
      // Safari iOS en modo standalone puede ignorar el flujo del plugin.
    } finally {
      window.setTimeout(() => {
        if (document.visibilityState === "visible") {
          window.location.reload();
        }
      }, 900);
      window.setTimeout(() => setIsUpdating(false), 1800);
    }
  };

  if (!needRefresh || promptDismissed) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-[300] flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className="w-full max-w-xl rounded-2xl border border-teal-200 bg-white p-4 shadow-xl ring-1 ring-teal-100"
      >
        <p className="text-sm font-medium text-slate-900">
          Hay una nueva versión disponible. Por favor, actualiza para aplicar los
          cambios.
        </p>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => void handleReload()}
            disabled={isUpdating}
            className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            {isUpdating ? "Actualizando..." : "Actualizar ahora"}
          </button>
        </div>
      </div>
    </div>
  );
};
