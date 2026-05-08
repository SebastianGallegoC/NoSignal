import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect, useRef } from "react";

const DEFAULT_UPDATE_CHECK_MS = 60_000;

export const usePwaRegister = () => {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const sw = useRegisterSW({
    onRegisteredSW: (_swUrl, registration) => {
      registrationRef.current = registration ?? null;
      // Al abrir la app, pedir de inmediato si hay SW nuevo (crítico para cold-start).
      try {
        if (typeof navigator === 'undefined' || navigator.onLine) {
          void registration?.update();
        }
      } catch (e) {
        // Ignorar errores iniciales de actualización (p. ej. offline).
        // eslint-disable-next-line no-console
        console.warn('ServiceWorker initial update failed (ignored)', e);
      }
    },
  });

  useEffect(() => {
    const triggerUpdate = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      try {
        void registrationRef.current?.update();
      } catch (e) {
        // Ignoramos fallos al actualizar el Service Worker (por ejemplo, sin red).
        // eslint-disable-next-line no-console
        console.warn('ServiceWorker update failed (ignored)', e);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        triggerUpdate();
      }
    };

    triggerUpdate();
    const bootDelays = [250, 1500, 4000].map((ms) =>
      window.setTimeout(triggerUpdate, ms),
    );

    const timer = window.setInterval(triggerUpdate, DEFAULT_UPDATE_CHECK_MS);
    window.addEventListener("online", triggerUpdate);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      for (const id of bootDelays) {
        window.clearTimeout(id);
      }
      window.clearInterval(timer);
      window.removeEventListener("online", triggerUpdate);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return sw;
};
