import { useEffect } from 'react';

import { purgeExpiredForms, syncPendingForms } from '../services/sync';

export const useOfflineSync = (): void => {
  useEffect(() => {
    const runSync = async () => {
      await purgeExpiredForms();
      await syncPendingForms();
    };

    runSync();

    const handleOnline = () => {
      runSync();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);
};
