import ExcelJS from "exceljs";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OfflineForm } from "@/services/db";
import { REQUIRED_FIELDS, type FormFieldKey } from "@/types/formFields";

import {
  MATRIZ_F_PSA_HEADERS,
  MATRIZ_ROW_CELL_SOURCES,
  MATRIZ_SHEET_NAME,
  buildMatrizCaracterizacionRow,
  buildMatrizCaracterizacionWorkbook,
  downloadMatrizCaracterizacionXlsx,
  formatFechaMatriz,
  matrizCaracterizacionFilename,
} from "./matrizCaracterizacionExport";

const minimalForm = (): OfflineForm => ({
  id_formulario: "test-id",
  id_usuario: "u1",
  fecha_hora: "2026-05-05T12:00:00.000Z",
  gps: { latitud: 7.5, longitud: -72.25, precision: 12 },
  datos_formulario: {},
  fotos: [],
  estado_sincronizacion: "PENDIENTE",
});

describe("matrizCaracterizacionExport — encabezados y definición de fila", () => {
  it("define 76 encabezados y 76 fuentes de celda", () => {
    expect(MATRIZ_F_PSA_HEADERS.length).toBe(76);
    expect(MATRIZ_ROW_CELL_SOURCES.length).toBe(76);
    expect(MATRIZ_F_PSA_HEADERS[0]).toBe("ID");
    expect(MATRIZ_F_PSA_HEADERS[7]).toContain("BENEFICIARIO");
  });

  it("cada campo del formulario (salvo longitud/latitud decimales) aparece en la definición de exportación", () => {
    const keysInSources = new Set<FormFieldKey>();
    for (const src of MATRIZ_ROW_CELL_SOURCES) {
      if (src.kind === "field" || src.kind === "fecha") {
        keysInSources.add(src.key);
      }
    }
    for (const k of REQUIRED_FIELDS) {
      if (k === "longitud" || k === "latitud") {
        expect(keysInSources.has(k)).toBe(false);
        continue;
      }
      expect(keysInSources.has(k), `falta en matriz: ${k}`).toBe(true);
    }
    expect(keysInSources.size).toBe(REQUIRED_FIELDS.length - 2);
  });
});

describe("formatFechaMatriz", () => {
  it("convierte ISO a DD/MM/AAAA (UTC)", () => {
    expect(formatFechaMatriz("2026-03-15T00:00:00.000Z")).toBe("15/03/2026");
  });

  it("deja DD/MM/AAAA sin cambios", () => {
    expect(formatFechaMatriz("05/04/2026")).toBe("05/04/2026");
  });

  it("cadena vacía → vacío", () => {
    expect(formatFechaMatriz("")).toBe("");
    expect(formatFechaMatriz("   ")).toBe("");
  });

  it("texto no parseable se devuelve tal cual", () => {
    expect(formatFechaMatriz("pronto")).toBe("pronto");
  });
});

describe("buildMatrizCaracterizacionRow", () => {
  it("produce 76 celdas string y usa GPS si faltan longitud/latitud en datos", () => {
    const f = minimalForm();
    f.datos_formulario = {
      entidad_aportante: "Entidad X",
      nombres_apellidos_beneficiario: "María López",
    };
    const row = buildMatrizCaracterizacionRow(f);
    expect(row).toHaveLength(76);
    expect(row.every((c) => typeof c === "string")).toBe(true);
    expect(row[0]).toBe("1");
    expect(row[1]).toBe("Entidad X");
    expect(row[7]).toBe("María López");
    expect(row[29]).toContain("-72.25");
    expect(row[33]).toContain("7.5");
  });

  it("prioriza longitud y latitud del formulario sobre el objeto gps", () => {
    const f = minimalForm();
    f.datos_formulario = {
      longitud: "-74.123456",
      latitud: "5.987654",
    };
    const row = buildMatrizCaracterizacionRow(f);
    expect(row[29]).toBe("-74.123456");
    expect(row[33]).toBe("5.987654");
  });

  it("alinea cada columna con MATRIZ_ROW_CELL_SOURCES cuando los datos llevan prefijo único", () => {
    const datos: Record<string, string> = {};
    for (const k of REQUIRED_FIELDS) {
      datos[k] = `v:${k}`;
    }
    const f = minimalForm();
    f.datos_formulario = datos;

    const row = buildMatrizCaracterizacionRow(f);
    MATRIZ_ROW_CELL_SOURCES.forEach((src, i) => {
      if (src.kind === "id") {
        expect(row[i]).toBe("1");
        return;
      }
      if (src.kind === "field") {
        expect(row[i]).toBe(`v:${src.key}`);
        return;
      }
      if (src.kind === "fecha") {
        expect(row[i]).toBe(formatFechaMatriz(`v:${src.key}`));
        return;
      }
      if (src.kind === "lon") {
        expect(row[i]).toBe("v:longitud");
        return;
      }
      if (src.kind === "lat") {
        expect(row[i]).toBe("v:latitud");
      }
    });
  });
});

describe("matrizCaracterizacionFilename", () => {
  it("incluye id saneado, fecha del día y extensión xlsx", () => {
    const f = minimalForm();
    f.id_formulario = "abc::123";
    const name = matrizCaracterizacionFilename(f);
    expect(name).toMatch(/^Matriz_caracterizacion_/);
    expect(name).toMatch(/\.xlsx$/);
    expect(name).toContain("abc_123");
    expect(name).toMatch(/\d{4}-\d{2}-\d{2}\.xlsx$/);
  });
});

describe("buildMatrizCaracterizacionWorkbook", () => {
  it("escribe título, cabeceras fila 7 y datos fila 8; roundtrip conserva valores", async () => {
    const f = minimalForm();
    f.datos_formulario = {
      entidad_aportante: "CENS",
      nombres_apellidos_beneficiario: "Ana Gómez",
      observaciones: "Nota fin",
    };

    const wb = await buildMatrizCaracterizacionWorkbook(f);
    const ws = wb.getWorksheet(MATRIZ_SHEET_NAME);
    expect(ws).toBeTruthy();
    expect(ws!.getCell(5, 5).value).toBe("CARACTERIZACIÓN SOCIAL");
    expect(ws!.getCell(7, 1).value).toBe(MATRIZ_F_PSA_HEADERS[0]);
    expect(ws!.getCell(7, 76).value).toBe(MATRIZ_F_PSA_HEADERS[75]);
    expect(ws!.getCell(8, 2).value).toBe("CENS");
    expect(ws!.getCell(8, 8).value).toBe("Ana Gómez");

    const buf = await wb.xlsx.writeBuffer();
    expect(buf.byteLength).toBeGreaterThan(2500);

    const wb2 = new ExcelJS.Workbook();
    await wb2.xlsx.load(buf);
    const ws2 = wb2.getWorksheet(MATRIZ_SHEET_NAME);
    expect(ws2!.getCell(8, 63).value).toBe("Nota fin");
  });
});

describe("downloadMatrizCaracterizacionXlsx", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("genera blob, enlace temporal y revoca la URL", async () => {
    const f = minimalForm();
    f.datos_formulario = { entidad_aportante: "X" };

    const createSpy = vi.fn(() => "blob:test-matriz");
    const revokeSpy = vi.fn();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: createSpy,
      revokeObjectURL: revokeSpy,
    });

    const clickSpy = vi.fn();
    const removeSpy = vi.fn();
    const mockAnchor = {
      href: "",
      download: "",
      rel: "",
      click: clickSpy,
      remove: removeSpy,
    } as unknown as HTMLAnchorElement;

    const createElSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        if (tag === "a") {
          return mockAnchor;
        }
        return document.createElement.bind(document)(tag as "div");
      });
    const appendSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation(() => mockAnchor);

    await downloadMatrizCaracterizacionXlsx(f);

    expect(createSpy).toHaveBeenCalled();
    expect(mockAnchor.download).toMatch(/Matriz_caracterizacion_.*\.xlsx$/);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(appendSpy).toHaveBeenCalledWith(mockAnchor);
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith("blob:test-matriz");

    createElSpy.mockRestore();
    appendSpy.mockRestore();
  });
});
