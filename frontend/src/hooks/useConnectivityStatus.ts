import { useEffect, useState } from "react";

export const useConnectivityStatus = (): boolean => {
  const initialOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  const [isOnline, setIsOnline] = useState(initialOnline);

  useEffect(() => {
    if (import.meta.env.MODE === "test") {
      return;
    }

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return isOnline;
};