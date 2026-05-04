import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { FotoServidorAutenticada } from "@/components/form/FotoServidorAutenticada";
import { Button } from "@/components/ui/button";
import { FORM_SECTIONS } from "@/config/formSections";
import {
  fieldLabel,
  inputKindForField,
  triOptions,
} from "@/config/formFieldMeta";
import { fieldSelectOptions } from "@/config/formSelectOptions";
import type { FormFieldKey } from "@/types/formFields";

const rowClass =
  "flex flex-col gap-0.5 border-b border-slate-100 py-2.5 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4";

function displayFieldValue(key: FormFieldKey, raw: unknown): string {
  const s = raw == null ? "" : String(raw).trim();
  if (!s) {
    return "—";
  }
  const kind = inputKindForField(key);
  if (kind === "select-tri") {
    const found = triOptions.find((o) => o.value === s);
    const lbl = found?.label != null ? String(found.label).trim() : "";
    return lbl.length > 0 ? lbl : s;
  }
  if (kind === "select") {
    const opts = fieldSelectOptions[key];
    const found = opts?.find((o) => o.value === s);
    return found?.label ?? s;
  }
  return s;
}

export interface FormularioSnapshot {
  datos_formulario: Record<string, unknown>;
  gps?: { latitud: number; longitud: number; precision?: number | null } | null;
  /** `data` = data URL local; `path` = ruta en servidor; `serverFormId` + `serverIndex` = imagen vía API autenticado. */
  fotos?: Array<{
    nombre_archivo: string;
    data?: string;
    path?: string;
    serverFormId?: string;
    serverIndex?: number;
  }>;
}

const buildMapLink = (lat: number, lon: number) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;

type FotoVista = {
  nombre_archivo: string;
  src: string;
};

function FotoModal({
  foto,
  onClose,
}: {
  foto: FotoVista | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!foto) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [foto, onClose]);

  if (!foto) {
    return null;
  }

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = foto.src;
    link.download = foto.nombre_archivo || "foto.jpg";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        aria-label="Cerrar vista previa"
        onClick={onClose}
      />
      <div className="relative z-10 flex w-full max-w-4xl flex-col gap-4 rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-slate-200 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">
              {foto.nombre_archivo}
            </h2>
            <p className="text-sm text-slate-500">
              Vista ampliada de la imagen
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>
        <div className="flex max-h-[70dvh] items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
          <img
            src={foto.src}
            alt={foto.nombre_archivo}
            className="max-h-[70dvh] w-full object-contain"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={handleDownload}
            className="w-full bg-teal-700 text-white hover:bg-teal-800 sm:w-auto"
          >
            Descargar imagen
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Volver
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ReadOnlySection({
  sectionTitle,
  fieldKeys,
  datos,
  initiallyOpen,
}: {
  sectionTitle: string;
  fieldKeys: readonly FormFieldKey[];
  datos: Record<string, unknown>;
  initiallyOpen: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <details
      className="rounded-xl border border-slate-200 bg-white shadow-sm open:shadow-md"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-slate-900">
        {sectionTitle}
      </summary>
      <dl className="border-t border-slate-100 px-4 pb-3 pt-1">
        {fieldKeys.map((key) => (
          <div key={key} className={rowClass}>
            <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500 sm:w-[42%]">
              {fieldLabel(key)}
            </dt>
            <dd className="min-w-0 text-sm text-slate-900 sm:text-right">
              {displayFieldValue(key, datos[key])}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

export const FormularioRespuestaReadOnly = ({
  snapshot,
}: {
  snapshot: FormularioSnapshot;
}) => {
  const { datos_formulario: datos, gps, fotos = [] } = snapshot;
  const [previewFoto, setPreviewFoto] = useState<FotoVista | null>(null);
  const [remoteSrcMap, setRemoteSrcMap] = useState<
    Record<string, string | null>
  >({});
  const hasAnyField = FORM_SECTIONS.some((sec) =>
    sec.fields.some((key) => {
      const v = datos[key];
      return v != null && String(v).trim() !== "";
    }),
  );

  if (!hasAnyField && !gps && fotos.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
        No hay respuestas de campos para mostrar (p. ej. registro antiguo sin
        copia local o datos vacíos en servidor).
      </div>
    );
  }

  const openPreview = (foto: FotoVista) => setPreviewFoto(foto);

  const resolveRemoteSrc = (photoKey: string, src: string | null) => {
    setRemoteSrcMap((prev) => ({ ...prev, [photoKey]: src }));
  };

  return (
    <div className="space-y-4 text-slate-800">
      {gps ? (
        <section className="rounded-xl border border-slate-200 bg-slate-50/90 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Ubicación GPS
          </h3>
          <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Latitud
              </dt>
              <dd className="font-mono text-slate-900">{gps.latitud}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Longitud
              </dt>
              <dd className="font-mono text-slate-900">{gps.longitud}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Precisión (m)
              </dt>
              <dd className="font-mono text-slate-900">
                {gps.precision != null && gps.precision > 0
                  ? gps.precision
                  : "—"}
              </dd>
            </div>
          </dl>
          <a
            href={buildMapLink(gps.latitud, gps.longitud)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex text-sm font-medium text-teal-700 underline-offset-2 hover:underline"
          >
            Ver en OpenStreetMap
          </a>
        </section>
      ) : null}

      {fotos.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Fotos ({fotos.length})
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {fotos.map((f, idx) => (
              <button
                key={`${f.nombre_archivo}-${idx}`}
                type="button"
                onClick={() => {
                  if (f.data) {
                    openPreview({
                      nombre_archivo: f.nombre_archivo,
                      src: f.data,
                    });
                    return;
                  }
                  const photoKey = `${f.nombre_archivo}-${idx}`;
                  const remoteSrc = remoteSrcMap[photoKey];
                  if (remoteSrc) {
                    openPreview({
                      nombre_archivo: f.nombre_archivo,
                      src: remoteSrc,
                    });
                  }
                }}
                className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-left"
              >
                <figure className="overflow-hidden">
                  {f.data ? (
                    <img
                      src={f.data}
                      alt={f.nombre_archivo}
                      className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : f.serverFormId != null && f.serverIndex != null ? (
                    <FotoServidorAutenticada
                      formId={f.serverFormId}
                      photoIndex={f.serverIndex}
                      alt={f.nombre_archivo}
                      loadDeferred={f.serverIndex > 0}
                      onSrcChange={(src) =>
                        resolveRemoteSrc(`${f.nombre_archivo}-${idx}`, src)
                      }
                      className="transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex aspect-square flex-col items-center justify-center gap-1 bg-slate-100 p-2 text-center text-[11px] text-slate-600">
                      <span className="font-medium text-slate-700">
                        Sin vista previa
                      </span>
                      <span className="break-all font-mono text-[9px] leading-tight text-slate-500">
                        {(f.path ?? f.nombre_archivo).split(/[/\\]/).pop()}
                      </span>
                    </div>
                  )}
                  <figcaption
                    className="truncate px-1.5 py-1 text-center text-[10px] text-slate-600"
                    title={f.nombre_archivo}
                  >
                    {f.nombre_archivo}
                  </figcaption>
                </figure>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <FotoModal foto={previewFoto} onClose={() => setPreviewFoto(null)} />

      <div className="space-y-2">
        {FORM_SECTIONS.map((section, idx) => (
          <ReadOnlySection
            key={section.id}
            sectionTitle={section.title}
            fieldKeys={section.fields}
            datos={datos}
            initiallyOpen={idx === 0}
          />
        ))}
      </div>
    </div>
  );
};
