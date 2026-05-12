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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e2f2ee_0,_#f6f7f5_45%,_#f6f7f5_100%)] px-3 py-4 text-slate-900 sm:px-4 sm:py-10">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-4 sm:mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-teal-700 sm:text-xs sm:tracking-[0.35em]">
            NoSignal
          </p>
          <section className="mb-3 mt-2 grid gap-2 sm:mb-5 sm:mt-4 sm:gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-200/80 bg-white/95 p-3 shadow-sm ring-1 ring-amber-100/60 sm:rounded-2xl sm:p-5">
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700 sm:text-[11px] sm:tracking-[0.16em]">
                    Pendientes
                  </p>
                  <p className="mt-1 text-2xl font-semibold leading-none text-slate-900 sm:mt-2 sm:text-4xl">
                    {pendientes}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 sm:px-2.5 sm:py-1 sm:text-[11px]">
                  Cola local
                </span>
              </div>
              <p className="mt-2 text-xs leading-snug text-slate-600 sm:mt-3 sm:text-sm sm:leading-normal">
                Formularios guardados en este equipo y pendientes por
                sincronizar.
              </p>
            </div>
            <div className="rounded-xl border border-rose-200/80 bg-white/95 p-3 shadow-sm ring-1 ring-rose-100/60 sm:rounded-2xl sm:p-5">
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-700 sm:text-[11px] sm:tracking-[0.16em]">
                    Errores sync
                  </p>
                  <p className="mt-1 text-2xl font-semibold leading-none text-slate-900 sm:mt-2 sm:text-4xl">
                    {erroresSync}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 sm:px-2.5 sm:py-1 sm:text-[11px]">
                  Requiere revisión
                </span>
              </div>
              <p className="mt-2 text-xs leading-snug text-slate-600 sm:mt-3 sm:text-sm sm:leading-normal">
                Registros que fallaron al enviar y necesitan reintento.
              </p>
            </div>
          </section>
          <h1 className="mt-1 text-xl font-semibold leading-tight sm:mt-2 sm:text-3xl sm:leading-normal">
            Selecciona una opción V.1.1
          </h1>
          <p className="mt-1 text-xs leading-snug text-slate-600 sm:mt-2 sm:text-sm sm:leading-normal">
            Puedes diligenciar un nuevo formulario o revisar los ya registrados.
          </p>
        </header>

        <section className="grid gap-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/formulario"
            className="rounded-xl border border-teal-100 bg-white/90 p-3 shadow-[0_18px_40px_-35px_rgba(15,118,110,0.6)] transition hover:-translate-y-0.5 sm:rounded-2xl sm:p-6"
          >
            <h2 className="text-base font-semibold leading-snug text-teal-800 sm:text-lg sm:leading-normal">
              Completar formularios
            </h2>
            <p className="mt-1.5 text-xs leading-snug text-slate-600 sm:mt-2 sm:text-sm sm:leading-normal">
              Captura nuevos registros con GPS, fotos y sincronización
              offline-first.
            </p>
          </Link>

          <Link
            to="/formularios-diligenciados"
            className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-[0_18px_40px_-35px_rgba(30,41,59,0.45)] transition hover:-translate-y-0.5 sm:rounded-2xl sm:p-6"
          >
            <h2 className="text-base font-semibold leading-snug text-slate-900 sm:text-lg sm:leading-normal">
              Ver formularios diligenciados
            </h2>
            <p className="mt-1.5 text-xs leading-snug text-slate-600 sm:mt-2 sm:text-sm sm:leading-normal">
              Historial de este equipo y, si hay sesión, formularios ya
              guardados en el servidor.
            </p>
          </Link>

          <Link
            to="/importar-formularios"
            className="rounded-xl border border-indigo-100 bg-white/90 p-3 shadow-[0_18px_40px_-35px_rgba(79,70,229,0.35)] transition hover:-translate-y-0.5 sm:rounded-2xl sm:p-6 md:col-span-2 lg:col-span-1"
          >
            <h2 className="text-base font-semibold leading-snug text-indigo-900 sm:text-lg sm:leading-normal">
              Importar formularios
            </h2>
            <p className="mt-1.5 text-xs leading-snug text-slate-600 sm:mt-2 sm:text-sm sm:leading-normal">
              Cargá datos desde Excel (plantilla PLANTILLA.xlsx): campos del
              formulario y coordenadas, sin fotos. Quedan en cola para
              sincronizar.
            </p>
          </Link>
        </section>
      </div>
    </div>
  );
};
