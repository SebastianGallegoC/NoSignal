import { describe, expect, it } from "vitest";

import type { OfflineForm } from "@/services/db";
import {
  validateFormValues,
  validateFormValuesWithFieldDetails,
  validateOfflineFormPayload,
} from "@/services/formValidation";
import { REQUIRED_FIELDS, type FormValues } from "@/types/formFields";

const emptyValues = (): FormValues =>
  Object.fromEntries(REQUIRED_FIELDS.map((k) => [k, ""])) as FormValues;

describe("formValidation — envío mínimo", () => {
  it("validateFormValues no marca obligatorios en formulario vacío", () => {
    const issues = validateFormValues(emptyValues());
    expect(issues.filter((i) => i.code.startsWith("field_"))).toHaveLength(0);
  });

  it("validateOfflineFormPayload exige nombre del beneficiario", () => {
    const datos: Record<string, unknown> = {};
    for (const k of REQUIRED_FIELDS) {
      datos[k] = "";
    }
    const form: OfflineForm = {
      id_formulario: "x",
      fecha_hora: new Date().toISOString(),
      gps: { latitud: 4.6, longitud: -74.08, precision: 4 },
      datos_formulario: datos,
      fotos: [],
      estado_sincronizacion: "PENDIENTE",
    };
    const issues = validateOfflineFormPayload(form);
    expect(issues.map((i) => i.code)).toContain("beneficiario_required");
  });

  it("validateOfflineFormPayload acepta solo beneficiario y GPS dentro de rango", () => {
    const datos: Record<string, unknown> = {};
    for (const k of REQUIRED_FIELDS) {
      datos[k] = "";
    }
    datos.nombres_apellidos_beneficiario = "Ana Pérez";
    const form: OfflineForm = {
      id_formulario: "x",
      fecha_hora: new Date().toISOString(),
      gps: { latitud: 4.6, longitud: -74.08, precision: 4 },
      datos_formulario: datos,
      fotos: [],
      estado_sincronizacion: "PENDIENTE",
    };
    const issues = validateOfflineFormPayload(form);
    expect(issues).toHaveLength(0);
  });

  it("validateOfflineFormPayload exige visita 1/2/3 en cada foto", () => {
    const datos: Record<string, unknown> = {};
    for (const k of REQUIRED_FIELDS) {
      datos[k] = "";
    }
    datos.nombres_apellidos_beneficiario = "Ana Pérez";
    const form: OfflineForm = {
      id_formulario: "x",
      fecha_hora: new Date().toISOString(),
      gps: { latitud: 4.6, longitud: -74.08, precision: 4 },
      datos_formulario: datos,
      fotos: [{ nombre_archivo: "a.jpg", data: "data:image/jpeg;base64,AA==" }],
      estado_sincronizacion: "PENDIENTE",
    };
    const issues = validateOfflineFormPayload(form);
    expect(issues.map((i) => i.code)).toContain("fotos_visita_required");
  });

  it("validateOfflineFormPayload rechaza fecha_actualizacion anterior a fecha_hora", () => {
    const datos: Record<string, unknown> = {};
    for (const k of REQUIRED_FIELDS) {
      datos[k] = "";
    }
    datos.nombres_apellidos_beneficiario = "Ana Pérez";
    const form: OfflineForm = {
      id_formulario: "x",
      fecha_hora: "2026-05-10T12:00:00.000Z",
      fecha_actualizacion: "2026-05-01T12:00:00.000Z",
      gps: { latitud: 4.6, longitud: -74.08, precision: 4 },
      datos_formulario: datos,
      fotos: [],
      estado_sincronizacion: "PENDIENTE",
    };
    const issues = validateOfflineFormPayload(form);
    expect(issues.map((i) => i.code)).toContain("fecha_actualizacion_before_envio");
  });
});

describe("formValidation — campos texto libre tras cambios de importación", () => {
  it("acepta exposicion_solar_adecuada como texto (no exige Si/No/NR)", () => {
    const values = emptyValues();
    values.nombres_apellidos_beneficiario = "Ana";
    values.exposicion_solar_adecuada = "Sol directo en la mañana";
    const { fieldIssues } = validateFormValuesWithFieldDetails(values);
    expect(
      fieldIssues.filter((i) => i.field === "exposicion_solar_adecuada"),
    ).toHaveLength(0);
  });

  it("acepta distancia_infraestructura_adecuada con texto y sufijo M", () => {
    const values = emptyValues();
    values.distancia_infraestructura_adecuada = "40 M aprox";
    const { fieldIssues } = validateFormValuesWithFieldDetails(values);
    expect(
      fieldIssues.filter((i) => i.field === "distancia_infraestructura_adecuada"),
    ).toHaveLength(0);
  });

  it("no marca zona vacía como error (select sin validación estricta en import)", () => {
    const values = emptyValues();
    values.zona = "";
    const { fieldIssues } = validateFormValuesWithFieldDetails(values);
    expect(fieldIssues.filter((i) => i.field === "zona")).toHaveLength(0);
  });
});
