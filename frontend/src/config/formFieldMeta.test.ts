import { describe, expect, it } from "vitest";

import {
  fieldLabel,
  inputKindForField,
} from "@/config/formFieldMeta";

describe("formFieldMeta — campos ajustados (importación / UI)", () => {
  it("exposicion_solar_adecuada es texto libre, no tri-estado", () => {
    expect(inputKindForField("exposicion_solar_adecuada")).toBe("text");
  });

  it("distancia_infraestructura_adecuada es texto libre, no numérico", () => {
    expect(inputKindForField("distancia_infraestructura_adecuada")).toBe("text");
    expect(fieldLabel("distancia_infraestructura_adecuada")).toBe(
      "Distancia Infraestructura Adecuada",
    );
  });

  it("zona sigue siendo selector Urbana/Rural", () => {
    expect(inputKindForField("zona")).toBe("select");
    expect(fieldLabel("zona")).toBe("Zona(Urbana-Rural)");
  });

  it("numero_personas_nucleo_familiar sigue siendo numérico en el formulario", () => {
    expect(inputKindForField("numero_personas_nucleo_familiar")).toBe("number");
  });
});
