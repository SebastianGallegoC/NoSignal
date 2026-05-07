import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { countErrorForms, countPendingForms } from "@/services/sync";

export const InicioPage = () => {
  const [pendientes, setPendientes] = useState(0);
  const [erroresSync, setErroresSync] = useState(0);

  const refreshCounts = useCallback(async () => {
    const [pendingCount, errorCount] = await Promise.all([
      countPendingForms(),
      countErrorForms(),
    ]);
    setPendientes(pendingCount);
    setErroresSync(errorCount);
  }, []);

  useEffect(() => {
    void refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    const onOnline = () => {
      void refreshCounts();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshCounts();
      }
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshCounts]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dceee8_0,_#f2f6f4_40%,_#eef3f2_100%)] px-4 py-8 text-slate-900 sm:py-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 rounded-3xl border border-slate-200/60 bg-slate-900/95 p-5 text-slate-50 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.9)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-200/90">
            NoSignal
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Selecciona una opción V.1
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
            Gestiona tus formularios desde un solo lugar, incluso cuando estás
            sin conexión.
          </p>

          <section className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-300/25 bg-slate-800/80 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                Pendientes
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-4xl font-semibold leading-none text-white">
                  {pendientes}
                </p>
                <span className="rounded-full border border-amber-300/40 bg-amber-300/15 px-2.5 py-1 text-[11px] font-medium text-amber-100">
                  Cola local
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Formularios guardados en este equipo.
              </p>
            </div>

            <div className="rounded-2xl border border-rose-300/25 bg-slate-800/80 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200">
                Errores sync
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-4xl font-semibold leading-none text-white">
                  {erroresSync}
                </p>
                <span className="rounded-full border border-rose-300/40 bg-rose-300/15 px-2.5 py-1 text-[11px] font-medium text-rose-100">
                  Revisar
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Envíos fallidos que requieren reintento.
              </p>
            </div>
          </section>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <Link
            to="/formulario"
            className="group rounded-3xl border border-teal-200/80 bg-white/90 p-6 shadow-[0_18px_45px_-35px_rgba(15,118,110,0.55)] transition hover:-translate-y-0.5 hover:border-teal-300"
          >
            <div className="mb-4 inline-flex rounded-xl bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              Crear
            </div>
            <h2 className="text-xl font-semibold text-teal-800">
              Completar formularios
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Captura nuevos registros con GPS, fotos y sincronización
              offline-first.
            </p>
            <p className="mt-4 text-sm font-medium text-teal-700 group-hover:text-teal-800">
              Iniciar diligenciamiento
            </p>
          </Link>

          <Link
            to="/formularios-diligenciados"
            className="group rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_18px_45px_-35px_rgba(30,41,59,0.45)] transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <div className="mb-4 inline-flex rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
              Consultar
            </div>
            <h2 className="text-xl font-semibold text-slate-900">
              Ver formularios diligenciados
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Historial de este equipo y, si hay sesión, formularios ya
              guardados en el servidor.
            </p>
            <p className="mt-4 text-sm font-medium text-slate-700 group-hover:text-slate-900">
              Abrir historial y seguimiento
            </p>
          </Link>
        </section>
      </div>
    </div>
  );
};
