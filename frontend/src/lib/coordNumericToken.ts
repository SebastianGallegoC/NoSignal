import type { FormFieldKey } from "@/types/formFields";

/** Campos numéricos WGS84 (grados decimales y altitud) en formulario e importación Excel. */
export const COORD_NUMERIC_FIELD_KEYS = new Set<FormFieldKey>([
  "latitud",
  "longitud",
  "metros_sobre_nivel_mar",
]);

/**
 * Extrae el primer número de una celda (GMS o decimal), tolerando símbolos y coma decimal.
 * Incluye LONGITUD/LATITUD con sufijo o prefijo °, guion Unicode (Excel), y NFKC (ancho completo).
 * Ej.: "73°" → "73", "  -74,1° " → "-74.1", "°4,5" → "4.5", "−74,08°" (U+2212) → "-74.08".
 */
export function normalizeCoordNumericCell(raw: string): string {
  let t = raw.trim().normalize("NFKC").replace(/\s/g, "").replace(/,/g, ".");
  t = t.replace(/\u2212/g, "-");
  if (t === "") {
    return "";
  }
  t = t.replace(/^[^0-9.-]+/, "");
  const m = t.match(/^-?\d+(?:\.\d+)?/);
  return m ? m[0] : "";
}
