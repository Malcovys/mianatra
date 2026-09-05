import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { loadHomeDashboard } from "./home-dashboard.service";
import type { HomeDashboard } from "./home-dashboard.types";

export type HomeDashboardStatus = "loading" | "ready" | "error";

export function useHomeDashboard() {
  const [dashboard, setDashboard] = useState<HomeDashboard | null>(null);
  const [status, setStatus] = useState<HomeDashboardStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(() => {
    setStatus("loading");
    setErrorMessage(null);

    void loadHomeDashboard()
      .then((nextDashboard) => {
        setDashboard(nextDashboard);
        setStatus("ready");
      })
      .catch((error) => {
        console.error('[useHomeDashboard]: ', error);
        setErrorMessage("Impossible de charger ton accueil.");
        setStatus("error");
      });
  }, []);

  useFocusEffect(reload);

  return {
    dashboard,
    status,
    errorMessage,
    reload,
  };
}
