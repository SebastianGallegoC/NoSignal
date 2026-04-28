import { useCallback, useState } from 'react';

interface GPSState {
  latitud: number;
  longitud: number;
  precision: number;
}

interface GPSHookState {
  gps: GPSState | null;
  cargando: boolean;
  error: string | null;
  solicitarGPS: () => void;
}

const MAX_ACCURACY_METERS = 3;
const GPS_TIMEOUT_MS = 15000;

export const useGPS = (): GPSHookState => {
  const [gps, setGps] = useState<GPSState | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const solicitarGPS = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('GPS no disponible en este dispositivo.');
      return;
    }

    setCargando(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const precision = pos.coords.accuracy;
        if (precision > MAX_ACCURACY_METERS) {
          setError('Precision insuficiente, intenta nuevamente.');
          setGps(null);
        } else {
          setGps({
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
            precision,
          });
        }
        setCargando(false);
      },
      () => {
        setError('No se pudo obtener la ubicacion.');
        setCargando(false);
      },
      {
        enableHighAccuracy: true,
        timeout: GPS_TIMEOUT_MS,
        maximumAge: 0,
      },
    );
  }, []);

  return { gps, cargando, error, solicitarGPS };
};
