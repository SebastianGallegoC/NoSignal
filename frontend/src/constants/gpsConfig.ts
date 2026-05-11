export const MIN_GPS_PRECISION_METERS = 0.1;
export const MAX_GPS_PRECISION_METERS = 5;
export const MAX_GPS_ACCURACY_METERS = 100;
export const LEGACY_API_MAX_GPS_ACCURACY_METERS = 100;

/**
 * Punto usado cuando no hay captura GPS: cumple el esquema del API y la validación
 * de envío (solo se exige nombre del beneficiario).
 */
export const GPS_PLACEHOLDER_WHEN_NOT_CAPTURED = {
  latitud: 0,
  longitud: 0,
  precision: MAX_GPS_ACCURACY_METERS,
} as const;
