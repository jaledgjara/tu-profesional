// useSaveLocation — orquesta GPS, geocoding y persistencia en user_locations
// Capa: features/auth/hooks
// Service: locationService.* + authStore.refresh
//
// Es el hook más complejo del feature: combina permisos, GPS, reverse geocode,
// forward geocode (fallback) y la RPC upsert_user_location. La screen solo
// renderiza inputs y llama a las dos funciones expuestas: useGps() y save().
//
// Estado interno: las coords del GPS se cachean para no volver a pedirlas si el
// user las obtuvo y luego edita la dirección a mano antes de guardar.

import { useCallback, useState } from "react";

import {
  requestPermission,
  getCurrentCoords,
  reverseGeocode,
  geocodeAddress,
  upsertUserLocation,
  type Coords,
  type AddressFields,
} from "@/shared/services/locationService";
import { useAuthStore } from "@/features/auth/store/authStore";

export type GpsResult = Partial<AddressFields>;

export function useSaveLocation() {
  const refresh = useAuthStore((s) => s.refresh);

  const [coords, setCoords]         = useState<Coords | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [saving, setSaving]         = useState(false);

  /**
   * Pide permiso, obtiene GPS y reverse-geocode.
   * Devuelve los campos autocompletados para que la screen los pinte en sus inputs.
   * Throw si el permiso fue denegado o el GPS falló.
   */
  const useGps = useCallback(async (): Promise<GpsResult> => {
    setGpsLoading(true);
    try {
      const granted = await requestPermission();
      if (!granted) {
        throw new Error("Activá el permiso de ubicación desde Configuración.");
      }
      const c = await getCurrentCoords();
      setCoords(c);
      const address = await reverseGeocode(c);
      return address ?? {};
    } finally {
      setGpsLoading(false);
    }
  }, []);

  /**
   * Persiste la ubicación en user_locations vía RPC. Si no hubo GPS,
   * geocodifica la dirección textual primero. Refresca el authStore al final
   * para que el guard mande al user al home correspondiente.
   */
  const save = useCallback(
    async (address: AddressFields): Promise<void> => {
      setSaving(true);
      try {
        let finalCoords = coords;
        if (!finalCoords) {
          finalCoords = await geocodeAddress(address);
        }
        if (!finalCoords) {
          throw new Error(
            "No pudimos ubicar esa dirección. Probá usar el botón de GPS o revisá los datos.",
          );
        }
        await upsertUserLocation(finalCoords, address);
        await refresh();
      } finally {
        setSaving(false);
      }
    },
    [coords, refresh],
  );

  return { useGps, save, gpsLoading, saving };
}
