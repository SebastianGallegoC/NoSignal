import Dexie, { type Table } from 'dexie';

export type SyncStatus = 'PENDIENTE' | 'SINCRONIZANDO' | 'ERROR';

export interface OfflineForm {
  id_formulario: string;
  id_usuario: string;
  fecha_hora: string;
  gps: {
    latitud: number;
    longitud: number;
    precision: number;
  };
  datos_formulario: Record<string, unknown>;
  fotos: Array<{
    nombre_archivo: string;
    data: string;
  }>;
  estado_sincronizacion: SyncStatus;
  fecha_intento?: string;
  errores_sync?: number;
  ultimo_error?: string;
}

export interface SesionLocalRow {
  id: 'current';
  accessToken: string;
  username: string;
}

export class NoSignalDB extends Dexie {
  formularios!: Table<OfflineForm>;
  sesionLocal!: Table<SesionLocalRow>;

  constructor() {
    super('NoSignalDB');
    this.version(1).stores({
      formularios: '&id_formulario, estado_sincronizacion, fecha_hora',
    });
    this.version(2).stores({
      formularios: '&id_formulario, estado_sincronizacion, fecha_hora',
      sesionLocal: 'id',
    });
  }
}

export const db = new NoSignalDB();
