// Hook: useDashboardStats
// Capa: hook (orquesta loading/error/data)
// Cliente: profesional
//
// Carga las estadísticas del dashboard: visitas al perfil este mes vs anterior.
// Llama a get_my_profile_views (security invoker: filtra por auth.uid()).

import { useState, useEffect } from "react";

import { fetchMyProfileViews } from "@/shared/services/professionalSearchService";
import { strings } from "@/shared/utils/strings";

export interface ProfileViewsData {
  thisMonth: number;
  lastMonth: number;
}

export interface UseDashboardStatsResult {
  profileViews: ProfileViewsData | null;
  isLoading:    boolean;
  error:        string | null;
}

export function useDashboardStats(): UseDashboardStatsResult {
  const [profileViews, setProfileViews] = useState<ProfileViewsData | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchMyProfileViews()
      .then((data) => {
        if (cancelled) return;
        setProfileViews(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : strings.common.error);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { profileViews, isLoading, error };
}
