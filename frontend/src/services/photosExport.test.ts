import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import type { OfflineForm } from "@/services/db";

import {
  buildBeneficiarioFolderName,
  buildPhotosZip,
  dataUrlToUint8Array,
  photosZipFilename,
} from "@/services/photosExport";
import { matrizCaracterizacionFilename } from "@/services/matrizCaracterizacionExport";

/** JPEG mínimo válido (1×1 px) en data URL. */
const JPEG_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBkNDRkYGBk1KysrNTY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

function baseForm(overrides: Partial<OfflineForm> = {}): OfflineForm {
  return {
    id_formulario: "id-1",
    id_usuario: "user-1",
    fecha_hora: "2024-06-10T15:30:00.000Z",
    gps: { latitud: 4.5, longitud: -74.2, precision: 12 },
    datos_formulario: {
      nombres_apellidos_beneficiario: "María Pérez",
    },
    fotos: [],
    estado_sincronizacion: "PENDIENTE",
    ...overrides,
  };
}

describe("buildBeneficiarioFolderName", () => {
  it("prefija Fotos- y conserva tildes y espacios", () => {
    const f = baseForm({
      datos_formulario: { nombres_apellidos_beneficiario: "José  García" },
    });
    expect(buildBeneficiarioFolderName(f)).toBe("Fotos-José García");
  });

  it("elimina caracteres ilegales en Windows", () => {
    const f = baseForm({
      datos_formulario: {
        nombres_apellidos_beneficiario: 'Ana<>:|?*"\\',
      },
    });
    expect(buildBeneficiarioFolderName(f)).toBe("Fotos-Ana");
  });

  it("usa sin beneficiario si queda vacío", () => {
    const f = baseForm({
      datos_formulario: { nombres_apellidos_beneficiario: "   <>   " },
    });
    expect(buildBeneficiarioFolderName(f)).toBe("Fotos-sin beneficiario");
  });
});

describe("photosZipFilename", () => {
  it("coincide con el nombre de matriz pero extensión .zip", () => {
    const f = baseForm();
    expect(photosZipFilename(f)).toBe(
      matrizCaracterizacionFilename(f).replace(/\.xlsx$/i, ".zip"),
    );
  });
});

describe("dataUrlToUint8Array", () => {
  it("decodifica JPEG base64", () => {
    const bytes = dataUrlToUint8Array(JPEG_DATA_URL);
    expect(bytes.length).toBeGreaterThan(10);
    expect(bytes[0]).toBe(0xff);
    expect(bytes[1]).toBe(0xd8);
  });

  it("rechaza URL sin data:", () => {
    expect(() => dataUrlToUint8Array("https://x")).toThrow("data URL");
  });
});

describe("buildPhotosZip", () => {
  it("lanza si no hay fotos", async () => {
    const f = baseForm({ fotos: [] });
    await expect(buildPhotosZip(f)).rejects.toThrow("No hay fotos");
  });

  it("incluye Visita 1–3 y .keep en carpetas vacías", async () => {
    const root = "Fotos-María Pérez";
    const f = baseForm({
      fotos: [
        {
          nombre_archivo: "solo.jpg",
          data: JPEG_DATA_URL,
          visita: 2,
        },
      ],
    });
    const blob = await buildPhotosZip(f);
    const zip = await JSZip.loadAsync(blob);
    const paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
    expect(paths).toContain(`${root}/Visita 1/.keep`);
    expect(paths).toContain(`${root}/Visita 2/solo.jpg`);
    expect(paths).toContain(`${root}/Visita 3/.keep`);
    expect(paths.some((p) => p.includes("Sin visita"))).toBe(false);
  });

  it("reparte por visita 1, 2 y 3", async () => {
    const root = buildBeneficiarioFolderName(
      baseForm({
        datos_formulario: { nombres_apellidos_beneficiario: "B" },
      }),
    );
    const f = baseForm({
      datos_formulario: { nombres_apellidos_beneficiario: "B" },
      fotos: [
        { nombre_archivo: "a.jpg", data: JPEG_DATA_URL, visita: 1 },
        { nombre_archivo: "b.jpg", data: JPEG_DATA_URL, visita: 2 },
        { nombre_archivo: "c.jpg", data: JPEG_DATA_URL, visita: 3 },
      ],
    });
    const blob = await buildPhotosZip(f);
    const zip = await JSZip.loadAsync(blob);
    const paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
    expect(paths).toContain(`${root}/Visita 1/a.jpg`);
    expect(paths).toContain(`${root}/Visita 2/b.jpg`);
    expect(paths).toContain(`${root}/Visita 3/c.jpg`);
    expect(paths.some((p) => p.endsWith("/.keep"))).toBe(false);
  });

  it("coloca fotos sin visita en Sin visita", async () => {
    const root = buildBeneficiarioFolderName(baseForm());
    const f = baseForm({
      fotos: [
        { nombre_archivo: "v1.jpg", data: JPEG_DATA_URL, visita: 1 },
        { nombre_archivo: "orphan.jpg", data: JPEG_DATA_URL },
      ],
    });
    const blob = await buildPhotosZip(f);
    const zip = await JSZip.loadAsync(blob);
    const paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
    expect(paths).toContain(`${root}/Sin visita/orphan.jpg`);
    expect(paths).toContain(`${root}/Visita 1/v1.jpg`);
    expect(paths).toContain(`${root}/Visita 2/.keep`);
  });

  it("resuelve colisión de nombre en la misma carpeta", async () => {
    const root = buildBeneficiarioFolderName(baseForm());
    const f = baseForm({
      fotos: [
        { nombre_archivo: "x.jpg", data: JPEG_DATA_URL, visita: 1 },
        { nombre_archivo: "x.jpg", data: JPEG_DATA_URL, visita: 1 },
      ],
    });
    const blob = await buildPhotosZip(f);
    const zip = await JSZip.loadAsync(blob);
    const paths = Object.keys(zip.files).filter((p) => !zip.files[p].dir);
    expect(paths).toContain(`${root}/Visita 1/x.jpg`);
    expect(paths).toContain(`${root}/Visita 1/x-2.jpg`);
  });
});
