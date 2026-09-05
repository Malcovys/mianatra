import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { loadHomeDashboard } from "./home-dashboard.service";
import type { HomeDashboard } from "./home-dashboard.types";

export type HomeDashboardStatus = "loading" | "ready" | "error";

export function useHomeDashboard() {
  const loadIdRef = useRef(0);
  const [dashboard, setDashboard] = useState<HomeDashboard | null>(null);
  const [status, setStatus] = useState<HomeDashboardStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const reload = useCallback(() => {
    const loadId = loadIdRef.current + 1;
    loadIdRef.current = loadId;
    setStatus("loading");
    setErrorMessage(null);

    void loadHomeDashboard()
      .then((nextDashboard) => {
        if (loadIdRef.current !== loadId) {
          return;
        }
        setDashboard(nextDashboard);
        setStatus("ready");
      })
      .catch((error) => {
        console.error('[useHomeDashboard]: ', error);
        if (loadIdRef.current !== loadId) {
          return;
        }
        setErrorMessage("Impossible de charger ton accueil.");
        setStatus("error");
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
      return () => {
        loadIdRef.current += 1;
      };
    }, [reload]),
  );

  return {
    dashboard,
    status,
    errorMessage,
    reload,
  };
}
