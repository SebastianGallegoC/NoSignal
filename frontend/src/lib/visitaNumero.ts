export type VisitaNumero = 1 | 2 | 3 | 4;

export const VISITA_NUMEROS: readonly VisitaNumero[] = [1, 2, 3, 4];

export function isVisitaNumero(value: unknown): value is VisitaNumero {
  return value === 1 || value === 2 || value === 3 || value === 4;
}
