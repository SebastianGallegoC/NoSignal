import { describe, expect, it } from "vitest";

import type { HistorialForm } from "@/services/db";
import {
  getBeneficiarioDisplayName,
  normalizeTextoBusqueda,
  type DisplayRow,
} from "@/services/formHistory";

describe("formHistory — beneficiario", () => {
  it("getBeneficiarioDisplayName prioriza historial y recorta espacios", () => {
    const row: DisplayRow = {
      id_formulario: "a",
      onServer: true,
      server: {
        id_formulario: "a",
        id_usuario: "u",
        fecha_hora: "2026-01-01T00:00:00Z",
        latitud: 0,
        longitud: 0,
        precision: 1,
        datos_formulario: { nombres_apellidos_beneficiario: "  Ana Pérez  " },
        fotos: [],
      },
      historial: {
        id_formulario: "a",
        id_usuario: "u",
        fecha_hora: "2026-01-01T00:00:00Z",
        estado: "ENVIADO",
        datos_formulario: {
          nombres_apellidos_beneficiario: "  Local Gómez  ",
        },
      } satisfies HistorialForm,
    };
    expect(getBeneficiarioDisplayName(row)).toBe("Local Gómez");
  });

  it("getBeneficiarioDisplayName usa servidor si no hay historial", () => {
    const row: DisplayRow = {
      id_formulario: "b",
      onServer: true,
      server: {
        id_formulario: "b",
        id_usuario: "u",
        fecha_hora: "2026-01-01T00:00:00Z",
        latitud: 0,
        longitud: 0,
        precision: 1,
        datos_formulario: { nombres_apellidos_beneficiario: "Remoto Solo" },
        fotos: [],
      },
    };
    expect(getBeneficiarioDisplayName(row)).toBe("Remoto Solo");
  });

  it("normalizeTextoBusqueda quita tildes para comparar", () => {
    expect(normalizeTextoBusqueda("  José  ")).toBe("jose");
  });
});
