import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, it, expect, vi } from "vitest";
import { FormularioOverviewPanel } from "../FormularioOverviewPanel";

const defaultProps = {
  estado: "idle" as const,
  progreso: null,
  gps: { latitud: 1, longitud: 2, precision: 5 },
  error: null,
  cargando: false,
  onSolicitarGps: vi.fn(),
  modoCoordenadas: "automatico" as const,
  onChangeModoCoordenadas: vi.fn(),
  buildMapUrl: (lat: number, lon: number) => `https://map/${lat},${lon}`,
  buildExternalMapUrl: (lat: number, lon: number) =>
    `https://osm/${lat},${lon}`,
};

describe("FormularioOverviewPanel", () => {
  it("muestra botones GPS / Manual y dispara onChangeModoCoordenadas al elegir Manual", () => {
    const onChange = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(
        <FormularioOverviewPanel
          {...defaultProps}
          modoCoordenadas="automatico"
          onChangeModoCoordenadas={onChange}
        />,
      );
    });

    const manualBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Manual",
    ) as HTMLButtonElement;
    expect(manualBtn).toBeDefined();
    manualBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onChange).toHaveBeenCalledWith("manual");
    root.unmount();
    container.remove();
  });

  it("en modo Manual no muestra Tomar ubicación ni iframe del mapa", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(
        <FormularioOverviewPanel
          {...defaultProps}
          modoCoordenadas="manual"
          onChangeModoCoordenadas={vi.fn()}
        />,
      );
    });

    expect(
      Array.from(container.querySelectorAll("button")).some(
        (b) => b.textContent?.includes("Tomar ubicación"),
      ),
    ).toBe(false);
    expect(container.querySelector("iframe")).toBeNull();
    root.unmount();
    container.remove();
  });
});
