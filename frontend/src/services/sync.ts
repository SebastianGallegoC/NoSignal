import { db, type OfflineForm } from './db';
import { postForm } from './api';
import { REQUIRED_FIELDS } from '../types/formFields';

const RETENTION_DAYS = 3;
const BACKOFF_STEPS_MS = [30_000, 60_000, 5 * 60_000, 15 * 60_000, 30 * 60_000];
const MAX_GPS_ACCURACY_METERS = 3;

const isEmptyValue = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  return false;
};

const parseNumeric = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return null;
};

const TRI_VALUES = new Set(['Si', 'No', 'NR']);
const TRI_FIELDS = [
  'mujer_cabeza_hogar',
  'persona_discapacidad',
  'exposicion_solar_adecuada',
  'interes_autoconsumo',
  'interes_comercializacion',
  'asistencia_capacitaciones',
  'permite_visitas',
  'compromiso_cuidado_arbol',
  'firma_acuerdo',
  'autoriza_tratamiento_datos',
  'autoriza_registros_fotograficos',
  'cumple_criterios_huerta',
  'cumple_criterios_arbol',
  'distancia_infraestructura_adecuada',
  'distancia_redes_electricas_adecuada',
  'cercania_ronda_hidrica',
] as const;

const isValidIsoDate = (value: unknown): boolean => {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
};

export const validateFormPayload = (form: OfflineForm): string[] => {
  const errors: string[] = [];

  if (!form.gps || form.gps.precision > MAX_GPS_ACCURACY_METERS) {
    errors.push('gps_precision');
  }

  if (!form.fotos || form.fotos.length < 3 || form.fotos.length > 15) {
    errors.push('fotos_count');
  }

  if (!/^[0-9A-Za-z._-]{3,64}$/.test(form.id_usuario)) {
    errors.push('id_usuario_format');
  }

  for (const field of REQUIRED_FIELDS) {
    if (isEmptyValue(form.datos_formulario?.[field])) {
      errors.push(`field_${field}`);
    }
  }

  const age = parseNumeric(form.datos_formulario?.edad);
  if (age === null || age < 0 || age > 120) {
    errors.push('edad_range');
  }

  const phone = String(form.datos_formulario?.telefono ?? '').trim();
  if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
    errors.push('telefono_format');
  }

  const score = parseNumeric(form.datos_formulario?.satisfaccion_1_5);
  if (score === null || score < 1 || score > 5) {
    errors.push('satisfaccion_range');
  }

  const visit1 = form.datos_formulario?.fecha_visita_1;
  const visit2 = form.datos_formulario?.fecha_visita_2;
  const visit3 = form.datos_formulario?.fecha_visita_3;
  if (!isValidIsoDate(visit1) || !isValidIsoDate(visit2) || !isValidIsoDate(visit3)) {
    errors.push('fechas_visita_invalid');
  } else {
    const d1 = Date.parse(String(visit1));
    const d2 = Date.parse(String(visit2));
    const d3 = Date.parse(String(visit3));
    if (!(d1 <= d2 && d2 <= d3)) {
      errors.push('fechas_visita_order');
    }
  }

  for (const triField of TRI_FIELDS) {
    const raw = String(form.datos_formulario?.[triField] ?? '').trim();
    if (!TRI_VALUES.has(raw)) {
      errors.push(`tri_${triField}`);
    }
  }

  return errors;
};

export const enqueueForm = async (form: OfflineForm): Promise<void> => {
  await db.formularios.put({
    ...form,
    estado_sincronizacion: 'PENDIENTE',
    errores_sync: 0,
  });
  await db.historialFormularios.put({
    id_formulario: form.id_formulario,
    id_usuario: form.id_usuario,
    fecha_hora: form.fecha_hora,
    estado: 'PENDIENTE',
  });
};

export const countPendingForms = async (): Promise<number> => {
  return db.formularios.where('estado_sincronizacion').equals('PENDIENTE').count();
};

export const countErrorForms = async (): Promise<number> => {
  return db.formularios.where('estado_sincronizacion').equals('ERROR').count();
};

export interface SyncErrorItem {
  id_formulario: string;
  id_usuario: string;
  errores_sync: number;
  fecha_intento?: string;
  ultimo_error?: string;
}

export const listSyncErrors = async (limit = 5): Promise<SyncErrorItem[]> => {
  const rows = await db.formularios.where('estado_sincronizacion').equals('ERROR').sortBy('fecha_hora');
  return rows
    .slice(-limit)
    .reverse()
    .map((row) => ({
      id_formulario: row.id_formulario,
      id_usuario: row.id_usuario,
      errores_sync: row.errores_sync ?? 0,
      fecha_intento: row.fecha_intento,
      ultimo_error: row.ultimo_error,
    }));
};

export const purgeExpiredForms = async (): Promise<void> => {
  const now = Date.now();
  const cutoff = now - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const all = await db.formularios.toArray();

  for (const form of all) {
    const time = Date.parse(form.fecha_hora);
    if (!Number.isNaN(time) && time < cutoff) {
      await db.formularios.delete(form.id_formulario);
    }
  }
};

export const syncPendingForms = async (): Promise<void> => {
  if (!navigator.onLine) {
    return;
  }

  const pending = await db.formularios
    .where('estado_sincronizacion')
    .anyOf(['PENDIENTE', 'ERROR'])
    .sortBy('fecha_hora');

  for (const form of pending) {
    const intentos = form.errores_sync ?? 0;
    const delay = BACKOFF_STEPS_MS[Math.min(intentos, BACKOFF_STEPS_MS.length - 1)];
    const lastAttempt = form.fecha_intento ? Date.parse(form.fecha_intento) : Date.parse(form.fecha_hora);
    if (!Number.isNaN(lastAttempt) && Date.now() - lastAttempt < delay) {
      continue;
    }

    await db.formularios.update(form.id_formulario, {
      estado_sincronizacion: 'SINCRONIZANDO',
      fecha_intento: new Date().toISOString(),
      ultimo_error: undefined,
    });

    try {
      const response = await postForm(form);
      if (!response.ok) {
        throw new Error(`HTTP_${response.status}`);
      }

      await db.historialFormularios.update(form.id_formulario, {
        estado: 'ENVIADO',
        fecha_envio: new Date().toISOString(),
        ultimo_error: undefined,
      });
      await db.formularios.delete(form.id_formulario);
    } catch (error) {
      const errores_sync = (form.errores_sync ?? 0) + 1;
      const message = error instanceof Error ? error.message : 'sync_error';
      await db.formularios.update(form.id_formulario, {
        estado_sincronizacion: 'ERROR',
        errores_sync,
        fecha_intento: new Date().toISOString(),
        ultimo_error: message,
      });
      await db.historialFormularios.update(form.id_formulario, {
        estado: 'ERROR',
        ultimo_error: message,
      });
    }
  }
};
