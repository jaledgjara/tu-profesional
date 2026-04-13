// useSaveLocation — orquesta GPS, geocoding y persistencia en user_locations
// Capa: features/auth/hooks
// Service: locationService.* + authStore.refresh
//
// Es el hook más complejo del feature: combina permisos, GPS, reverse geocode,
// forward geocode (fallback) y la RPC upsert_user_location. La screen solo
// renderiza inputs y llama a las dos funciones expuestas: fetchGpsAddress() y save().
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
   *
   * Nota: no es un React hook (no llama a otros hooks internamente).
   * Se llama fetchGpsAddress para no confundir con la convención `use*`.
   */
  const fetchGpsAddress = useCallback(async (): Promise<GpsResult> => {
    console.log("[useSaveLocation::fetchGpsAddress] El user tocó 'Usar ubicación actual'. Solicitando permiso…");
    setGpsLoading(true);
    try {
      const granted = await requestPermission();
      if (!granted) {
        console.warn("[useSaveLocation::fetchGpsAddress] Permiso denegado — el user deberá ingresar la dirección manualmente.");
        throw new Error("Activá el permiso de ubicación desde Configuración.");
      }
      console.log("[useSaveLocation::fetchGpsAddress] Permiso concedido. Obteniendo coordenadas GPS…");
      const c = await getCurrentCoords();
      setCoords(c);
      console.log("[useSaveLocation::fetchGpsAddress] Coordenadas cacheadas en estado. Iniciando reverse geocode…");
      const address = await reverseGeocode(c);
      if (address) {
        console.log("[useSaveLocation::fetchGpsAddress] Dirección autocompletada para los inputs del form.");
      } else {
        console.warn("[useSaveLocation::fetchGpsAddress] Reverse geocode no devolvió dirección — inputs quedarán vacíos.");
      }
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
      console.log("[useSaveLocation::save] Guardando ubicación — dirección:", `${address.street} ${address.number}, ${address.city ?? "—"}, ${address.province ?? "Mendoza"}`);
      setSaving(true);
      try {
        let finalCoords = coords;
        if (finalCoords) {
          console.log("[useSaveLocation::save] Usando coordenadas del GPS cacheadas →", `lat: ${finalCoords.lat}, lng: ${finalCoords.lng}`);
        } else {
          console.log("[useSaveLocation::save] Sin GPS cacheado — forward geocoding la dirección ingresada…");
          finalCoords = await geocodeAddress(address);
        }
        if (!finalCoords) {
          console.error("[useSaveLocation::save] No se pudo resolver la dirección ni por GPS ni por geocoding.");
          throw new Error(
            "No pudimos ubicar esa dirección. Probá usar el botón de GPS o revisá los datos.",
          );
        }
        console.log("[useSaveLocation::save] Persistiendo en user_locations vía RPC…");
        await upsertUserLocation(finalCoords, address);
        console.log("[useSaveLocation::save] Ubicación guardada. Refrescando authStore…");
        await refresh();
        console.log("[useSaveLocation::save] authStore actualizado. El guard redirigirá al home.");
      } finally {
        setSaving(false);
      }
    },
    [coords, refresh],
  );

  return { fetchGpsAddress, save, gpsLoading, saving };
}
